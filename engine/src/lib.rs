// ==========================================
// Mjolnir High-Performance Load Testing Core
// ==========================================

pub mod data;
pub mod distributed;
pub mod executor;
pub mod exporters;
pub mod metrics;
pub mod protocols;
pub mod scripting;
pub mod server;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EngineConfig {
    pub port: u16,
    pub mode: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum EngineState {
    Stopped,
    Starting,
    Idle,
    Running,
    Stopping,
    Error,
}
