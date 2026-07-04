pub mod aggregator;
pub mod collector;
pub mod thresholds;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LatencyPercentiles {
    pub p50: f64,
    pub p90: f64,
    pub p95: f64,
    pub p99: f64,
    pub p999: f64,
    pub avg: f64,
    pub min: f64,
    pub max: f64,
}

impl Default for LatencyPercentiles {
    fn default() -> Self {
        Self {
            p50: 0.0,
            p90: 0.0,
            p95: 0.0,
            p99: 0.0,
            p999: 0.0,
            avg: 0.0,
            min: 0.0,
            max: 0.0,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct MicrosecondMetrics {
    pub dns_resolution: LatencyPercentiles,
    pub tcp_connect: LatencyPercentiles,
    pub tls_handshake: LatencyPercentiles,
    pub ttfb: LatencyPercentiles,
    pub total_duration: LatencyPercentiles,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LiveMetricsFrame {
    pub timestamp: u64,
    pub elapsed_seconds: f64,
    pub current_vus: u32,
    pub current_rps: f64,
    pub total_requests: u64,
    pub successful_requests: u64,
    pub failed_requests: u64,
    pub error_rate: f64,
    pub bandwidth_in_bytes_per_sec: f64,
    pub bandwidth_out_bytes_per_sec: f64,
    pub latencies: MicrosecondMetrics,
    pub threshold_results: Vec<ThresholdResult>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThresholdResult {
    pub rule: String,
    pub passed: bool,
    pub current_value: f64,
}

#[derive(Debug, Clone)]
pub struct RequestSample {
    pub timestamp: u64,
    pub duration_us: u64,
    pub ttfb_us: u64,
    pub dns_us: u64,
    pub tcp_us: u64,
    pub tls_us: u64,
    pub bytes_in: u64,
    pub bytes_out: u64,
    pub status_code: u16,
    pub is_error: bool,
}
