use super::TelemetryExporter;
use crate::metrics::LiveMetricsFrame;
use async_trait::async_trait;
use reqwest::Client;

pub struct InfluxDbExporter {
    client: Client,
    url: String,
    org: String,
    bucket: String,
    token: String,
}

impl InfluxDbExporter {
    pub fn new(url: &str, org: &str, bucket: &str, token: &str) -> Self {
        Self {
            client: Client::new(),
            url: url.trim_end_matches('/').to_string(),
            org: org.to_string(),
            bucket: bucket.to_string(),
            token: token.to_string(),
        }
    }
}

#[async_trait]
impl TelemetryExporter for InfluxDbExporter {
    async fn export(&self, frame: &LiveMetricsFrame) {
        let endpoint = format!("{}/api/v2/write?org={}&bucket={}&precision=s", self.url, self.org, self.bucket);
        let line_protocol = format!(
            "mjolnir_stats vus={}i,rps={},total_req={}i,failed_req={}i,p95={},p99={} {}",
            frame.current_vus,
            frame.current_rps,
            frame.total_requests,
            frame.failed_requests,
            frame.latencies.total_duration.p95,
            frame.latencies.total_duration.p99,
            frame.timestamp
        );

        let _ = self.client.post(&endpoint)
            .header("Authorization", format!("Token {}", self.token))
            .header("Content-Type", "text/plain; charset=utf-8")
            .body(line_protocol)
            .send()
            .await;
    }
}
