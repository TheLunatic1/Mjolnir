pub mod ws_server;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "command", content = "data")]
pub enum IpcCommand {
    RunTest { scenario_json: String },
    AbortTest,
    GetStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "event", content = "payload")]
pub enum IpcEvent {
    StatusChanged { state: String },
    MetricsFrame { frame: crate::metrics::LiveMetricsFrame },
    LogMessage { level: String, source: String, message: String },
    TestCompleted { summary_json: String },
    Error { message: String },
}
