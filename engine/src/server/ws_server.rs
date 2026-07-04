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
use futures::{sink::SinkExt, stream::StreamExt};
use serde::{Deserialize, Serialize};
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

#[derive(Debug, Deserialize)]
struct TestScenarioPayload {
    pub execution: ExecutionProfileConfig,
    pub requests: Vec<RequestSpec>,
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

async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
) -> Response {
    ws.on_upgrade(move |socket| handle_socket(socket, state))
}

async fn handle_socket(socket: WebSocket, state: AppState) {
    let (mut sender, mut receiver) = socket.split();
    let (event_tx, mut event_rx) = mpsc::unbounded_channel::<IpcEvent>();

    // Spawn event loop pushing from event_tx out to WebSocket
    tokio::spawn(async move {
        while let Some(event) = event_rx.recv().await {
            if let Ok(json) = serde_json::to_string(&event) {
                if sender.send(Message::Text(json)).await.is_err() {
                    break;
                }
            }
        }
    });

    // Send initial status
    let _ = event_tx.send(IpcEvent::StatusChanged { state: "idle".to_string() });
    let _ = event_tx.send(IpcEvent::LogMessage {
        level: "info".to_string(),
        source: "engine".to_string(),
        message: "⚡ Mjolnir Native Engine connected via loopback IPC.".to_string(),
    });

    while let Some(Ok(msg)) = receiver.next().await {
        if let Message::Text(text) = msg {
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

                            let event_tx_clone = event_tx.clone();
                            let state_clone = state.clone();
                            let stop_clone = stop_signal.clone();

                            // Spawn the execution harness
                            tokio::spawn(async move {
                                let collector = MetricsCollector::new();
                                let metrics_sender = collector.get_sender();

                                // Spawn metrics streaming loop (every 500ms)
                                let collector_stop = stop_clone.clone();
                                let stream_tx = event_tx_clone.clone();
                                let start_time = tokio::time::Instant::now();
                                let target_vus = scenario.execution.vus.unwrap_or(10);

                                let metrics_task = tokio::spawn(async move {
                                    let mut interval = tokio::time::interval(Duration::from_millis(500));
                                    loop {
                                        tokio::select! {
                                            _ = interval.tick() => {
                                                let elapsed = start_time.elapsed().as_secs_f64();
                                                let frame = collector.get_live_frame(elapsed, target_vus).await;
                                                let _ = stream_tx.send(IpcEvent::MetricsFrame { frame });
                                            }
                                            _ = collector_stop.notified() => {
                                                let elapsed = start_time.elapsed().as_secs_f64();
                                                let frame = collector.get_live_frame(elapsed, target_vus).await;
                                                let _ = stream_tx.send(IpcEvent::MetricsFrame { frame });
                                                break;
                                            }
                                        }
                                    }
                                });

                                // Select and execute profile
                                let requests = scenario.requests;
                                match scenario.execution.profile_type.as_str() {
                                    "ramping_vu" => {
                                        let stages = scenario.execution.stages.unwrap_or_default();
                                        let exec = RampingVuExecutor::new(stages);
                                        exec.run(requests, metrics_sender, stop_clone.clone()).await;
                                    }
                                    "constant_arrival_rate" => {
                                        let rps = scenario.execution.target_rps.unwrap_or(100);
                                        let dur = scenario.execution.duration_seconds.unwrap_or(30);
                                        let max_v = scenario.execution.max_vus.unwrap_or(500);
                                        let exec = ConstantArrivalRateExecutor::new(rps, dur, max_v);
                                        exec.run(requests, metrics_sender, stop_clone.clone()).await;
                                    }
                                    "spike" => {
                                        let vus = scenario.execution.vus.unwrap_or(500);
                                        let dur = scenario.execution.duration_seconds.unwrap_or(20);
                                        let exec = SpikeExecutor::new(vus, dur);
                                        exec.run(requests, metrics_sender, stop_clone.clone()).await;
                                    }
                                    "soak" => {
                                        let vus = scenario.execution.vus.unwrap_or(20);
                                        let dur = scenario.execution.duration_seconds.unwrap_or(3600);
                                        let exec = SoakExecutor::new(vus, dur);
                                        exec.run(requests, metrics_sender, stop_clone.clone()).await;
                                    }
                                    _ => {
                                        // Constant VU default
                                        let vus = scenario.execution.vus.unwrap_or(10);
                                        let dur = scenario.execution.duration_seconds.unwrap_or(30);
                                        let exec = ConstantVuExecutor::new(vus, dur);
                                        exec.run(requests, metrics_sender, stop_clone.clone()).await;
                                    }
                                }

                                stop_clone.notify_one();
                                let _ = metrics_task.await;

                                let mut is_run_write = state_clone.is_running.write().await;
                                *is_run_write = false;
                                drop(is_run_write);

                                let _ = event_tx_clone.send(IpcEvent::StatusChanged { state: "idle".to_string() });
                                let _ = event_tx_clone.send(IpcEvent::TestCompleted {
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
    }
}
