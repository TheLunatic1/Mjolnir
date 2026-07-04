use super::{ProtocolClient, RequestSpec};
use crate::metrics::RequestSample;
use async_trait::async_trait;
use std::time::{Instant, SystemTime, UNIX_EPOCH};

pub struct SmtpImapClient;

impl SmtpImapClient {
    pub fn new() -> Self {
        Self
    }
}

#[async_trait]
impl ProtocolClient for SmtpImapClient {
    async fn execute(&self, req: &RequestSpec) -> RequestSample {
        let start = Instant::now();
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        // Simulated SMTP EHLO / AUTH / MAIL FROM transaction or IMAP LOGIN / SELECT
        tokio::time::sleep(std::time::Duration::from_millis(8)).await;
        let duration_us = start.elapsed().as_micros() as u64;

        RequestSample {
            timestamp,
            duration_us,
            ttfb_us: duration_us / 2,
            dns_us: 20,
            tcp_us: 50,
            tls_us: 100,
            bytes_in: 128,
            bytes_out: req.body.as_ref().map(|b| b.len() as u64).unwrap_or(256),
            status_code: 250, // SMTP 250 OK
            is_error: false,
        }
    }
}
