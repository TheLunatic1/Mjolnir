use super::TelemetryExporter;
use crate::metrics::LiveMetricsFrame;
use async_trait::async_trait;
use tokio::net::UdpSocket;

pub struct DatadogExporter {
    target_addr: String,
    prefix: String,
}

impl DatadogExporter {
    pub fn new(host: &str, port: u16, prefix: &str) -> Self {
        Self {
            target_addr: format!("{}:{}", host, port),
            prefix: prefix.to_string(),
        }
    }
}

#[async_trait]
impl TelemetryExporter for DatadogExporter {
    async fn export(&self, frame: &LiveMetricsFrame) {
        if let Ok(socket) = UdpSocket::bind("0.0.0.0:0").await {
            let p95 = format!("{}.latency.p95:{:.2}|g|#service:mjolnir", self.prefix, frame.latencies.total_duration.p95);
            let rps = format!("{}.rps:{:.2}|g|#service:mjolnir", self.prefix, frame.current_rps);
            let vus = format!("{}.vus:{}|g|#service:mjolnir", self.prefix, frame.current_vus);

            let _ = socket.send_to(p95.as_bytes(), &self.target_addr).await;
            let _ = socket.send_to(rps.as_bytes(), &self.target_addr).await;
            let _ = socket.send_to(vus.as_bytes(), &self.target_addr).await;
        }
    }
}
