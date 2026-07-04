use super::ClusterMessage;
use futures::{SinkExt, StreamExt};
use tokio_tungstenite::connect_async;
use tokio_tungstenite::tungstenite::Message;
use tracing::{info, error};

pub struct WorkerNode {
    master_url: String,
    worker_id: String,
}

impl WorkerNode {
    pub fn new(master_url: &str, worker_id: &str) -> Self {
        Self {
            master_url: master_url.to_string(),
            worker_id: worker_id.to_string(),
        }
    }

    pub async fn connect_and_listen(&self) -> Result<(), Box<dyn std::error::Error>> {
        info!("🔗 Worker [{}] connecting to Master at {}...", self.worker_id, self.master_url);
        let (mut ws_stream, _) = connect_async(&self.master_url).await?;
        info!("✅ Worker connected successfully to cluster!");

        // Send registration message
        let reg_msg = ClusterMessage::RegisterWorker {
            worker_id: self.worker_id.clone(),
            ip: "127.0.0.1".to_string(),
            cpus: num_cpus(),
        };
        let json = serde_json::to_string(&reg_msg)?;
        ws_stream.send(Message::Text(json)).await?;

        while let Some(msg) = ws_stream.next().await {
            match msg {
                Ok(Message::Text(t)) => {
                    info!("📨 Worker received command from Master: {}", t);
                }
                Ok(Message::Close(_)) | Err(_) => {
                    error!("🔌 Connection to Master lost.");
                    break;
                }
                _ => {}
            }
        }

        Ok(())
    }
}

fn num_cpus() -> u32 {
    std::thread::available_parallelism().map(|n| n.get() as u32).unwrap_or(4)
}
