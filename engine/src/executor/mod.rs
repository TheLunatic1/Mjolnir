pub mod arrival_rate;
pub mod constant_vu;
pub mod ramping_vu;
pub mod soak;
pub mod spike;

pub use constant_vu::ConstantVuExecutor;

use crate::metrics::collector::MetricsCollector;
use crate::protocols::{http1::Http1Client, http2::Http2Client, RequestSpec};
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::mpsc::UnboundedSender;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StageConfig {
    pub duration_seconds: u64,
    pub target_vus: Option<u32>,
    pub target_rps: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionProfileConfig {
    pub profile_type: String, // constant_vu, ramping_vu, constant_arrival_rate, spike, soak
    pub vus: Option<u32>,
    pub duration_seconds: Option<u64>,
    pub stages: Option<Vec<StageConfig>>,
    pub target_rps: Option<u32>,
    pub max_vus: Option<u32>,
}

#[async_trait]
pub trait LoadExecutor: Send + Sync {
    async fn run(
        &self,
        requests: Vec<RequestSpec>,
        metrics_tx: UnboundedSender<crate::metrics::RequestSample>,
        stop_signal: Arc<tokio::sync::Notify>,
    );
}
