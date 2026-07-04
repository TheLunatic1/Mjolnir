use super::{ProtocolClient, RequestSpec};
use crate::metrics::RequestSample;
use async_trait::async_trait;
use std::time::{Instant, SystemTime, UNIX_EPOCH};

pub struct MqttClient;

impl MqttClient {
    pub fn new() -> Self {
        Self
    }
}

#[async_trait]
impl ProtocolClient for MqttClient {
    async fn execute(&self, req: &RequestSpec) -> RequestSample {
        let start = Instant::now();
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        // Simulated MQTT PUBLISH / SUBSCRIBE QoS 1 handshake
        tokio::time::sleep(std::time::Duration::from_millis(3)).await;
        let duration_us = start.elapsed().as_micros() as u64;

        RequestSample {
            timestamp,
            duration_us,
            ttfb_us: duration_us / 2,
            dns_us: 10,
            tcp_us: 20,
            tls_us: 30,
            bytes_in: 64,
            bytes_out: req.body.as_ref().map(|b| b.len() as u64).unwrap_or(32),
            status_code: 0,
            is_error: false,
        }
    }
}
