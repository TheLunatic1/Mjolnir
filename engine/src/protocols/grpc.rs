use super::{ProtocolClient, RequestSpec};
use crate::metrics::RequestSample;
use async_trait::async_trait;
use std::time::{Instant, SystemTime, UNIX_EPOCH};

pub struct GrpcClient;

impl GrpcClient {
    pub fn new() -> Self {
        Self
    }
}

#[async_trait]
impl ProtocolClient for GrpcClient {
    async fn execute(&self, req: &RequestSpec) -> RequestSample {
        let start = Instant::now();
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        // Simulated gRPC channel invocation via tonic / dynamic proto reflection
        tokio::time::sleep(std::time::Duration::from_millis(4)).await;
        let duration_us = start.elapsed().as_micros() as u64;

        RequestSample {
            timestamp,
            duration_us,
            ttfb_us: duration_us / 2,
            dns_us: 50,
            tcp_us: 100,
            tls_us: 150,
            bytes_in: 256,
            bytes_out: req.body.as_ref().map(|b| b.len() as u64).unwrap_or(0),
            status_code: 0, // gRPC OK status code is 0
            is_error: false,
        }
    }
}
