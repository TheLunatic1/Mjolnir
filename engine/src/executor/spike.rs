use super::{ConstantVuExecutor, LoadExecutor};
use crate::metrics::RequestSample;
use crate::protocols::RequestSpec;
use async_trait::async_trait;
use std::sync::Arc;
use tokio::sync::mpsc::UnboundedSender;
use tokio::sync::Notify;
use tracing::info;

pub struct SpikeExecutor {
    pub peak_vus: u32,
    pub duration_seconds: u64,
}

impl SpikeExecutor {
    pub fn new(peak_vus: u32, duration_seconds: u64) -> Self {
        Self { peak_vus, duration_seconds }
    }
}

#[async_trait]
impl LoadExecutor for SpikeExecutor {
    async fn run(
        &self,
        requests: Vec<RequestSpec>,
        metrics_tx: UnboundedSender<RequestSample>,
        stop_signal: Arc<Notify>,
    ) {
        info!("⚡ Starting Spike/Stress Strike: Instant surge to {} VUs for {}s", self.peak_vus, self.duration_seconds);
        let sub = ConstantVuExecutor::new(self.peak_vus, self.duration_seconds);
        sub.run(requests, metrics_tx, stop_signal).await;
    }
}
