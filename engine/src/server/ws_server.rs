use super::{IpcCommand, IpcEvent};
use crate::executor::{
    arrival_rate::ConstantArrivalRateExecutor, constant_vu::ConstantVuExecutor,
    ramping_vu::RampingVuExecutor, soak::SoakExecutor, spike::SpikeExecutor,
    ExecutionProfileConfig, LoadExecutor,
};
use crate::metrics::collector::MetricsCollector;
use crate::protocols::RequestSpec;
use crate::EngineConfig;
use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State,
    },
    response::{IntoResponse, Response},
    routing::{get, post},
    Router,
};
use futures::stream::StreamExt;
use serde::Deserialize;
use std::net::SocketAddr;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::{mpsc, Mutex, Notify, RwLock};
use tracing::{error, info, warn};

#[derive(Clone)]
pub struct AppState {
    pub config: EngineConfig,
    pub current_test_stop: Arc<Mutex<Option<Arc<Notify>>>>,
    pub is_running: Arc<RwLock<bool>>,
}

#[derive(Debug, Deserialize, Clone)]
#[allow(dead_code)] // Fields are received via JSON deserialization from the frontend
#[serde(rename_all = "camelCase")]
struct TestScenarioPayload {
    pub execution: ExecutionProfileConfig,
    pub requests: Vec<RequestSpec>,
    #[serde(default)]
    pub id: Option<String>,
    #[serde(default)]
    pub name: Option<String>,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub tls: Option<serde_json::Value>,
    #[serde(default)]
    pub thresholds: Option<serde_json::Value>,
    #[serde(default)]
    pub csv_parameter: Option<serde_json::Value>,
    #[serde(default)]
    pub csv_parameter_config: Option<serde_json::Value>,
    #[serde(default)]
    pub script_mode: Option<bool>,
    #[serde(default)]
    pub custom_type_script: Option<String>,
}

pub async fn start_server(addr: SocketAddr, config: EngineConfig) -> Result<(), Box<dyn std::error::Error>> {
    let state = AppState {
        config,
        current_test_stop: Arc::new(Mutex::new(None)),
        is_running: Arc::new(RwLock::new(false)),
    };

    let app = Router::new()
        .route("/ws", get(ws_handler))
        .route("/health", get(|| async { "OK" }))
        .route("/stop", post(stop_handler))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    info!("🚀 Mjolnir IPC WebSocket Server ready and accepting connections on ws://{}/ws", addr);
    
    axum::serve(listener, app).await?;
    Ok(())
}

async fn stop_handler(State(state): State<AppState>) -> impl IntoResponse {
    let mut lock = state.current_test_stop.lock().await;
    if let Some(stop_signal) = lock.take() {
        stop_signal.notify_one();
        info!("🛑 Stop signal dispatched via REST /stop endpoint.");
        "Stopped"
    } else {
        "No test running"
    }
}

fn get_active_vus_at_time(execution: &ExecutionProfileConfig, elapsed_sec: f64) -> u32 {
    match execution.profile_type.as_str() {
        "ramping_vu" => {
            if let Some(stages) = &execution.stages {
                let mut accumulated_time = 0.0;
                for stage in stages {
                    accumulated_time += stage.duration_seconds as f64;
                    if elapsed_sec <= accumulated_time {
                        return stage.target_vus.unwrap_or(10);
                    }
                }
                if let Some(last) = stages.last() {
                    return last.target_vus.unwrap_or(10);
                }
            }
            execution.vus.unwrap_or(10)
        }
        "constant_arrival_rate" => execution.max_vus.unwrap_or(500),
        _ => execution.vus.unwrap_or(10),
    }
}

async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
) -> Response {
    ws.on_upgrade(move |socket| handle_socket(socket, state))
}

/// Unified WebSocket handler — uses a single select! loop for both
/// incoming commands and outgoing events. No socket.split() needed.
/// This ensures the connection stays alive throughout the test duration.
async fn handle_socket(mut socket: WebSocket, state: AppState) {
    // Unbounded channel: execution harness → handle_socket → WS client
    let (event_tx, mut event_rx) = mpsc::unbounded_channel::<IpcEvent>();

    // Enqueue initial status events
    let _ = event_tx.send(IpcEvent::StatusChanged { state: "idle".to_string() });
    let _ = event_tx.send(IpcEvent::LogMessage {
        level: "info".to_string(),
        source: "engine".to_string(),
        message: "⚡ Mjolnir Native Engine connected via loopback IPC.".to_string(),
    });

    loop {
        tokio::select! {
            // Priority 1: drain outgoing event queue and write to WebSocket
            Some(event) = event_rx.recv() => {
                match serde_json::to_string(&event) {
                    Ok(json) => {
                        if socket.send(Message::Text(json)).await.is_err() {
                            warn!("WS send failed — client disconnected. Stopping handler.");
                            return;
                        }
                    }
                    Err(e) => {
                        // Serialization error (e.g., NaN in metrics). Log and skip frame.
                        error!("Failed to serialize IpcEvent: {}. Skipping frame.", e);
                    }
                }
            }

            // Priority 2: receive incoming command from Electron
            msg = socket.next() => {
                match msg {
                    Some(Ok(Message::Text(text))) => {
                        match serde_json::from_str::<IpcCommand>(&text) {
                            Ok(IpcCommand::GetStatus) => {
                                let running = *state.is_running.read().await;
                                let st = if running { "running" } else { "idle" };
                                let _ = event_tx.send(IpcEvent::StatusChanged { state: st.to_string() });
                            }
                            Ok(IpcCommand::AbortTest) => {
                                let mut lock = state.current_test_stop.lock().await;
                                if let Some(stop_signal) = lock.take() {
                                    stop_signal.notify_one();
                                    info!("🛑 Abort test command received over IPC.");
                                }
                            }
                            Ok(IpcCommand::RunTest { scenario_json }) => {
                                if *state.is_running.read().await {
                                    let _ = event_tx.send(IpcEvent::Error {
                                        message: "A load test is already actively running!".to_string(),
                                    });
                                    continue;
                                }

                                match serde_json::from_str::<TestScenarioPayload>(&scenario_json) {
                                    Ok(scenario) => {
                                        info!("▶️ Launching scenario with profile: {}", scenario.execution.profile_type);
                                        let _ = event_tx.send(IpcEvent::StatusChanged { state: "running".to_string() });

                                        let mut is_run_write = state.is_running.write().await;
                                        *is_run_write = true;
                                        drop(is_run_write);

                                        let stop_signal = Arc::new(Notify::new());
                                        let mut lock = state.current_test_stop.lock().await;
                                        *lock = Some(stop_signal.clone());
                                        drop(lock);

                                        let event_tx_for_harness = event_tx.clone();
                                        let state_for_harness = state.clone();
                                        let stop_clone = stop_signal.clone();

                                        // Spawn execution harness as independent task.
                                        // It communicates back via event_tx_for_harness.
                                        tokio::spawn(async move {
                                            let collector = MetricsCollector::new();
                                            let metrics_sender = collector.get_sender();

                                            // Extract execution profile (run JS if script mode)
                                            let (exec_profile, requests) = if scenario.script_mode.unwrap_or(false) && scenario.custom_type_script.is_some() {
                                                let script = scenario.custom_type_script.as_ref().unwrap();
                                                info!("📜 Script Mode enabled! Extracting profile from Embedded JS Runtime...");
                                                crate::scripting::js_runtime::extract_spec_from_script(
                                                    script,
                                                    scenario.execution.clone(),
                                                    scenario.requests.clone(),
                                                )
                                            } else {
                                                (scenario.execution.clone(), scenario.requests.clone())
                                            };

                                            // Spawn dedicated metrics streaming task (500ms interval)
                                            let metrics_event_tx = event_tx_for_harness.clone();
                                            let metrics_stop = stop_clone.clone();
                                            let exec_profile_for_metrics = exec_profile.clone();
                                            let start_time = tokio::time::Instant::now();

                                            let metrics_task = tokio::spawn(async move {
                                                let mut interval = tokio::time::interval(Duration::from_millis(500));
                                                // Skip first immediate tick so elapsed > 0
                                                interval.tick().await;

                                                loop {
                                                    tokio::select! {
                                                        _ = interval.tick() => {
                                                            let elapsed = start_time.elapsed().as_secs_f64();
                                                            let active_vus = get_active_vus_at_time(&exec_profile_for_metrics, elapsed);
                                                            let frame = collector.get_live_frame(elapsed, active_vus).await;
                                                            info!("📊 Metrics tick: elapsed={:.1}s vus={} total_req={}", elapsed, active_vus, frame.total_requests);
                                                            // If send fails, receiver (event_tx) was dropped → connection gone
                                                            if metrics_event_tx.send(IpcEvent::MetricsFrame { frame }).is_err() {
                                                                info!("Metrics channel closed — stopping metrics task.");
                                                                break;
                                                            }
                                                        }
                                                        _ = metrics_stop.notified() => {
                                                            // Send one final frame on stop
                                                            let elapsed = start_time.elapsed().as_secs_f64();
                                                            let active_vus = get_active_vus_at_time(&exec_profile_for_metrics, elapsed);
                                                            let frame = collector.get_live_frame(elapsed, active_vus).await;
                                                            let _ = metrics_event_tx.send(IpcEvent::MetricsFrame { frame });
                                                            info!("📊 Final metrics frame sent. Stopping metrics task.");
                                                            break;
                                                        }
                                                    }
                                                }
                                            });

                                            // Run the actual load executor
                                            match exec_profile.profile_type.as_str() {
                                                "ramping_vu" => {
                                                    let stages = exec_profile.stages.unwrap_or_default();
                                                    info!("🏃 Starting Ramping VUs profile with {} stages", stages.len());
                                                    let exec = RampingVuExecutor::new(stages);
                                                    exec.run(requests, metrics_sender, stop_clone.clone()).await;
                                                }
                                                "constant_arrival_rate" => {
                                                    let rps = exec_profile.target_rps.unwrap_or(100);
                                                    let dur = exec_profile.duration_seconds.unwrap_or(30);
                                                    let max_v = exec_profile.max_vus.unwrap_or(500);
                                                    let exec = ConstantArrivalRateExecutor::new(rps, dur, max_v);
                                                    exec.run(requests, metrics_sender, stop_clone.clone()).await;
                                                }
                                                "spike" => {
                                                    let vus = exec_profile.vus.unwrap_or(500);
                                                    let dur = exec_profile.duration_seconds.unwrap_or(20);
                                                    let exec = SpikeExecutor::new(vus, dur);
                                                    exec.run(requests, metrics_sender, stop_clone.clone()).await;
                                                }
                                                "soak" => {
                                                    let vus = exec_profile.vus.unwrap_or(20);
                                                    let dur = exec_profile.duration_seconds.unwrap_or(3600);
                                                    let exec = SoakExecutor::new(vus, dur);
                                                    exec.run(requests, metrics_sender, stop_clone.clone()).await;
                                                }
                                                _ => {
                                                    // Constant VU default
                                                    let vus = exec_profile.vus.unwrap_or(10);
                                                    let dur = exec_profile.duration_seconds.unwrap_or(30);
                                                    info!("🏃 Starting Constant VU profile: {} vus for {}s", vus, dur);
                                                    let exec = ConstantVuExecutor::new(vus, dur);
                                                    exec.run(requests, metrics_sender, stop_clone.clone()).await;
                                                }
                                            }

                                            // Signal metrics task to stop and send final frame
                                            stop_clone.notify_one();
                                            let _ = metrics_task.await;

                                            // Mark test as finished
                                            let mut is_run_write = state_for_harness.is_running.write().await;
                                            *is_run_write = false;
                                            drop(is_run_write);

                                            let _ = event_tx_for_harness.send(IpcEvent::StatusChanged { state: "idle".to_string() });
                                            let _ = event_tx_for_harness.send(IpcEvent::TestCompleted {
                                                summary_json: "{\"status\": \"completed\"}".to_string(),
                                            });
                                            info!("🏁 Test scenario execution finished successfully.");
                                        });
                                    }
                                    Err(e) => {
                                        error!("❌ Failed to parse scenario JSON: {}", e);
                                        let _ = event_tx.send(IpcEvent::Error {
                                            message: format!("Invalid scenario payload: {}", e),
                                        });
                                    }
                                }
                            }
                            Err(e) => {
                                warn!("Received unknown IPC payload: {}", e);
                            }
                        }
                    }
                    Some(Ok(Message::Ping(data))) => {
                        // Respond to ping to keep connection alive
                        let _ = socket.send(Message::Pong(data)).await;
                    }
                    Some(Ok(Message::Close(_))) | None => {
                        info!("WS client disconnected.");
                        return;
                    }
                    _ => {
                        // Ignore binary and other frame types
                    }
                }
            }
        }
    }
}
