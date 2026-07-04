use super::TelemetryExporter;
use crate::metrics::LiveMetricsFrame;
use async_trait::async_trait;
use std::sync::Arc;
use tokio::sync::RwLock;

pub struct PrometheusExporter {
    latest_frame: Arc<RwLock<Option<LiveMetricsFrame>>>,
}

impl PrometheusExporter {
    pub fn new() -> Self {
        Self {
            latest_frame: Arc::new(RwLock::new(None)),
        }
    }

    pub async fn format_metrics(&self) -> String {
        let guard = self.latest_frame.read().await;
        let frame = match guard.as_ref() {
            Some(f) => f,
            None => return "# Mjolnir Prometheus Exporter - No data yet\n".to_string(),
        };

        format!(
            "# HELP mjolnir_current_vus Current Virtual Users\n\
             # TYPE mjolnir_current_vus gauge\n\
             mjolnir_current_vus {}\n\n\
             # HELP mjolnir_current_rps Current Requests Per Second\n\
             # TYPE mjolnir_current_rps gauge\n\
             mjolnir_current_rps {:.2}\n\n\
             # HELP mjolnir_requests_total Total requests processed\n\
             # TYPE mjolnir_requests_total counter\n\
             mjolnir_requests_total {}\n\n\
             # HELP mjolnir_requests_failed Total failed requests\n\
             # TYPE mjolnir_requests_failed counter\n\
             mjolnir_requests_failed {}\n\n\
             # HELP mjolnir_latency_p95_ms 95th percentile latency in ms\n\
             # TYPE mjolnir_latency_p95_ms gauge\n\
             mjolnir_latency_p95_ms {:.2}\n\n\
             # HELP mjolnir_latency_p99_ms 99th percentile latency in ms\n\
             # TYPE mjolnir_latency_p99_ms gauge\n\
             mjolnir_latency_p99_ms {:.2}\n",
            frame.current_vus,
            frame.current_rps,
            frame.total_requests,
            frame.failed_requests,
            frame.latencies.total_duration.p95,
            frame.latencies.total_duration.p99
        )
    }
}

#[async_trait]
impl TelemetryExporter for PrometheusExporter {
    async fn export(&self, frame: &LiveMetricsFrame) {
        let mut guard = self.latest_frame.write().await;
        *guard = Some(frame.clone());
    }
}
