use super::{ConstantVuExecutor, LoadExecutor, StageConfig};
use crate::metrics::RequestSample;
use crate::protocols::RequestSpec;
use async_trait::async_trait;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::mpsc::UnboundedSender;
use tokio::sync::Notify;
use tracing::info;

pub struct RampingVuExecutor {
    pub stages: Vec<StageConfig>,
}

impl RampingVuExecutor {
    pub fn new(stages: Vec<StageConfig>) -> Self {
        Self { stages }
    }
}

#[async_trait]
impl LoadExecutor for RampingVuExecutor {
    async fn run(
        &self,
        requests: Vec<RequestSpec>,
        metrics_tx: UnboundedSender<RequestSample>,
        stop_signal: Arc<Notify>,
    ) {
        info!("📈 Starting Ramping VUs profile with {} stages", self.stages.len());
        
        for (idx, stage) in self.stages.iter().enumerate() {
            let target = stage.target_vus.unwrap_or(10);
            info!("⏳ Stage {}: Target VUs = {}, Duration = {}s", idx + 1, target, stage.duration_seconds);
            
            let stage_stop = Arc::new(Notify::new());
            let sub_executor = ConstantVuExecutor::new(target, stage.duration_seconds);
            
            let stop_clone = stop_signal.clone();
            let stage_stop_clone = stage_stop.clone();
            
            tokio::select! {
                _ = sub_executor.run(requests.clone(), metrics_tx.clone(), stage_stop_clone) => {}
                _ = stop_clone.notified() => {
                    info!("🛑 Ramping VU test aborted during Stage {}", idx + 1);
                    break;
                }
            }
        }
    }
}
