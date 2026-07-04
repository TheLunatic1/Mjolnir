use super::{ConstantVuExecutor, LoadExecutor};
use crate::metrics::RequestSample;
use crate::protocols::RequestSpec;
use async_trait::async_trait;
use std::sync::Arc;
use tokio::sync::mpsc::UnboundedSender;
use tokio::sync::Notify;
use tracing::info;

pub struct SoakExecutor {
    pub vus: u32,
    pub duration_seconds: u64,
}

impl SoakExecutor {
    pub fn new(vus: u32, duration_seconds: u64) -> Self {
        Self { vus, duration_seconds }
    }
}

#[async_trait]
impl LoadExecutor for SoakExecutor {
    async fn run(
        &self,
        requests: Vec<RequestSpec>,
        metrics_tx: UnboundedSender<RequestSample>,
        stop_signal: Arc<Notify>,
    ) {
        info!("🛁 Starting Soak Testing profile: {} VUs for {} hours/seconds", self.vus, self.duration_seconds);
        let sub = ConstantVuExecutor::new(self.vus, self.duration_seconds);
        sub.run(requests, metrics_tx, stop_signal).await;
    }
}
