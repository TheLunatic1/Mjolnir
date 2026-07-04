pub mod remote_ssh;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct HostStatsFrame {
    pub timestamp: u64,
    pub cpu_usage_percent: f64,
    pub memory_usage_percent: f64,
    pub memory_used_mb: f64,
    pub memory_total_mb: f64,
    pub disk_io_read_kbps: f64,
    pub disk_io_write_kbps: f64,
    pub network_rx_kbps: f64,
    pub network_tx_kbps: f64,
}
