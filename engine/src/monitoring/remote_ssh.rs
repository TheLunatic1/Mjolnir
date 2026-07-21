use super::HostStatsFrame;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tokio::time::interval;
use tracing::info;

pub struct SshMonitor {
    host: String,
    port: u16,
    username: String,
    poll_interval_ms: u64,
}

impl SshMonitor {
    pub fn new(host: &str, port: u16, username: &str, poll_interval_ms: u64) -> Self {
        Self {
            host: host.to_string(),
            port,
            username: username.to_string(),
            poll_interval_ms,
        }
    }

    pub async fn start_polling<F>(&self, mut callback: F)
    where
        F: FnMut(HostStatsFrame) + Send + 'static,
    {
        info!("🖥️ Starting SSH Agentless Host Monitoring for {}@{}:{}", self.username, self.host, self.port);
        let mut ticker = interval(Duration::from_millis(self.poll_interval_ms.max(500)));

        loop {
            ticker.tick().await;
            let now = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs();

            // Simulated SSH metric gathering from remote /proc/stat & /proc/meminfo
            // In a live production deployment, this executes remote SSH shell commands via russh or ssh2
            let frame = HostStatsFrame {
                timestamp: now,
                cpu_usage_percent: 34.5 + (rand::random::<f64>() * 10.0),
                memory_usage_percent: 62.0 + (rand::random::<f64>() * 5.0),
                memory_used_mb: 10240.0,
                memory_total_mb: 16384.0,
                disk_io_read_kbps: 450.0,
                disk_io_write_kbps: 1200.0,
                network_rx_kbps: 25000.0,
                network_tx_kbps: 85000.0,
            };

            callback(frame);
        }
    }
}
