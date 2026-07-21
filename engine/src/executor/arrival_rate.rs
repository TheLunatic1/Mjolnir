use super::{ConstantVuExecutor, LoadExecutor};
use crate::metrics::RequestSample;
use crate::protocols::RequestSpec;
use async_trait::async_trait;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::mpsc::UnboundedSender;
use tokio::sync::{Semaphore, Notify};
use tracing::{info, warn};

pub struct ConstantArrivalRateExecutor {
    pub target_rps: u32,
    pub duration_seconds: u64,
    pub max_vus: u32,
}

impl ConstantArrivalRateExecutor {
    pub fn new(target_rps: u32, duration_seconds: u64, max_vus: u32) -> Self {
        Self {
            target_rps,
            duration_seconds,
            max_vus,
        }
    }
}

#[async_trait]
impl LoadExecutor for ConstantArrivalRateExecutor {
    async fn run(
        &self,
        requests: Vec<RequestSpec>,
        metrics_tx: UnboundedSender<RequestSample>,
        stop_signal: Arc<Notify>,
    ) {
        info!(
            "🌊 Starting Constant Arrival Rate profile: {} RPS for {}s (max VUs: {})",
            self.target_rps, self.duration_seconds, self.max_vus
        );

        let requests_arc = Arc::new(requests);
        let semaphore = Arc::new(Semaphore::new(self.max_vus as usize));
        
        let mut clients_map = std::collections::HashMap::new();
        for req in requests_arc.iter() {
            clients_map.insert(req.id.clone(), ConstantVuExecutor::get_client(&req.protocol));
        }
        let clients_arc = Arc::new(clients_map);

        // Calculate interval between requests: 1,000,000 micros / target_rps
        let interval_micros = 1_000_000 / self.target_rps.max(1) as u64;
        let mut ticker = tokio::time::interval(Duration::from_micros(interval_micros));
        let test_start = tokio::time::Instant::now();
        let test_duration = Duration::from_secs(self.duration_seconds);

        loop {
            tokio::select! {
                _ = ticker.tick() => {
                    if test_start.elapsed() >= test_duration {
                        info!("⏱️ Constant Arrival Rate test completed by timeout.");
                        break;
                    }

                    // Attempt to acquire VU permit without waiting to avoid coordinated omission
                    match semaphore.clone().try_acquire_owned() {
                        Ok(permit) => {
                            let reqs = requests_arc.clone();
                            let clients = clients_arc.clone();
                            let tx = metrics_tx.clone();
                            
                            tokio::spawn(async move {
                                let _permit = permit; // Permit dropped when task finishes
                                if let Some(req) = reqs.first() {
                                    if let Some(client) = clients.get(&req.id) {
                                        let sample = client.execute(req).await;
                                        let _ = tx.send(sample);
                                    }
                                }
                            });
                        }
                        Err(_) => {
                            warn!("⚠️ Max VUs ({}) reached! Dropping request to maintain independent arrival rate.", self.max_vus);
                        }
                    }
                }
                _ = stop_signal.notified() => {
                    info!("🛑 Constant Arrival Rate test aborted by user signal.");
                    break;
                }
            }
        }
    }
}
