use super::LoadExecutor;
use crate::metrics::RequestSample;
use crate::protocols::{
    http1::Http1Client, http2::Http2Client, ProtocolClient, RequestSpec,
};
use async_trait::async_trait;
use futures::FutureExt;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::mpsc::UnboundedSender;
use tokio::sync::Notify;
use tracing::info;

pub struct ConstantVuExecutor {
    pub vus: u32,
    pub duration_seconds: u64,
}

impl ConstantVuExecutor {
    pub fn new(vus: u32, duration_seconds: u64) -> Self {
        Self { vus, duration_seconds }
    }

    pub fn get_client(protocol: &str) -> Arc<dyn ProtocolClient> {
        match protocol {
            "http2" => Arc::new(Http2Client::new(true)),
            "http3" => Arc::new(crate::protocols::http3::Http3Client::new()),
            "websocket" => Arc::new(crate::protocols::websocket::WebSocketClient::new()),
            "grpc" => Arc::new(crate::protocols::grpc::GrpcClient::new()),
            "graphql" => Arc::new(crate::protocols::graphql::GraphQlClient::new()),
            "tcp" | "udp" => Arc::new(crate::protocols::tcp_udp::TcpUdpClient::new()),
            "mqtt" => Arc::new(crate::protocols::mqtt::MqttClient::new()),
            "smtp" | "imap" => Arc::new(crate::protocols::smtp_imap::SmtpImapClient::new()),
            _ => Arc::new(Http1Client::new(true)),
        }
    }
}

#[async_trait]
impl LoadExecutor for ConstantVuExecutor {
    async fn run(
        &self,
        requests: Vec<RequestSpec>,
        metrics_tx: UnboundedSender<RequestSample>,
        stop_signal: Arc<Notify>,
    ) {
        info!("🚀 Starting Constant VU profile: {} VUs for {}s", self.vus, self.duration_seconds);
        let mut handles = Vec::new();
        let requests_arc = Arc::new(requests);

        for _ in 0..self.vus {
            let reqs = requests_arc.clone();
            let tx = metrics_tx.clone();
            let stop = stop_signal.clone();
            let duration = Duration::from_secs(self.duration_seconds);

            let handle = tokio::spawn(async move {
                let mut clients = Vec::with_capacity(reqs.len());
                for req in reqs.iter() {
                    clients.push(Self::get_client(&req.protocol));
                }

                let start_time = tokio::time::Instant::now();
                while start_time.elapsed() < duration {
                    if stop.notified().now_or_never().is_some() {
                        break;
                    }

                    for (idx, req) in reqs.iter().enumerate() {
                        if let Some(client) = clients.get(idx) {
                            let sample = client.execute(req).await;
                            let is_fast_error = sample.is_error && sample.duration_us < 5000;
                            let _ = tx.send(sample);

                            if is_fast_error {
                                // Prevent CPU starvation if connections fail instantly
                                tokio::task::yield_now().await;
                            }
                        }
                    }
                }
            });
            handles.push(handle);
        }

        // Wait for time to expire or stop signal
        tokio::select! {
            _ = tokio::time::sleep(Duration::from_secs(self.duration_seconds)) => {
                info!("⏱️ Constant VU test completed by timeout.");
            }
            _ = stop_signal.notified() => {
                info!("🛑 Constant VU test aborted by user signal.");
            }
        }

        for h in handles {
            h.abort();
        }
    }
}
