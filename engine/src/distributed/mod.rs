pub mod master;
pub mod worker;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "payload")]
pub enum ClusterMessage {
    RegisterWorker { worker_id: String, ip: String, cpus: u32 },
    StartStrike { test_id: String, scenario_json: String },
    AbortStrike { test_id: String },
    WorkerMetricsFrame { worker_id: String, frame_json: String },
    WorkerStatus { worker_id: String, state: String },
}
