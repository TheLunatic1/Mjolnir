use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{info, warn};

pub struct MasterCoordinator {
    workers: Arc<RwLock<HashMap<String, WorkerNodeInfo>>>,
}

#[derive(Debug, Clone)]
pub struct WorkerNodeInfo {
    pub worker_id: String,
    pub ip: String,
    pub cpus: u32,
    pub state: String,
}

impl MasterCoordinator {
    pub fn new() -> Self {
        Self {
            workers: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub async fn register_worker(&self, worker_id: &str, ip: &str, cpus: u32) {
        let mut w = self.workers.write().await;
        info!("🌐 Registered Cloud Worker Node [{}]: IP={}, CPUs={}", worker_id, ip, cpus);
        w.insert(worker_id.to_string(), WorkerNodeInfo {
            worker_id: worker_id.to_string(),
            ip: ip.to_string(),
            cpus,
            state: "idle".to_string(),
        });
    }

    pub async fn remove_worker(&self, worker_id: &str) {
        let mut w = self.workers.write().await;
        if w.remove(worker_id).is_some() {
            warn!("🔌 Worker Node [{}] disconnected from cluster.", worker_id);
        }
    }

    pub async fn get_worker_count(&self) -> usize {
        self.workers.read().await.len()
    }
}
