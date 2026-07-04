pub mod datadog;
pub mod influxdb;
pub mod prometheus;

use crate::metrics::LiveMetricsFrame;
use async_trait::async_trait;

#[async_trait]
pub trait TelemetryExporter: Send + Sync {
    async fn export(&self, frame: &LiveMetricsFrame);
}
