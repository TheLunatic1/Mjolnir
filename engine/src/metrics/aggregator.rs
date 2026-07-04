use super::{LatencyPercentiles, LiveMetricsFrame, MicrosecondMetrics, RequestSample};
use hdrhistogram::Histogram;
use std::time::{SystemTime, UNIX_EPOCH};

pub struct MetricsAggregator {
    total_duration_hist: Histogram<u64>,
    ttfb_hist: Histogram<u64>,
    dns_hist: Histogram<u64>,
    tcp_hist: Histogram<u64>,
    tls_hist: Histogram<u64>,

    pub total_requests: u64,
    pub successful_requests: u64,
    pub failed_requests: u64,
    pub total_bytes_in: u64,
    pub total_bytes_out: u64,
    pub start_timestamp: u64,
}

impl MetricsAggregator {
    pub fn new() -> Self {
        // 3 significant figures of precision, max 3,600,000,000 us (1 hour)
        let hist = | | Histogram::<u64>::new_with_bounds(1, 3_600_000_000, 3).unwrap();
        
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        Self {
            total_duration_hist: hist(),
            ttfb_hist: hist(),
            dns_hist: hist(),
            tcp_hist: hist(),
            tls_hist: hist(),
            total_requests: 0,
            successful_requests: 0,
            failed_requests: 0,
            total_bytes_in: 0,
            total_bytes_out: 0,
            start_timestamp: now,
        }
    }

    pub fn record(&mut self, sample: RequestSample) {
        self.total_requests += 1;
        if sample.is_error || sample.status_code >= 400 {
            self.failed_requests += 1;
        } else {
            self.successful_requests += 1;
        }

        self.total_bytes_in += sample.bytes_in;
        self.total_bytes_out += sample.bytes_out;

        let _ = self.total_duration_hist.record(sample.duration_us.max(1));
        if sample.ttfb_us > 0 { let _ = self.ttfb_hist.record(sample.ttfb_us); }
        if sample.dns_us > 0 { let _ = self.dns_hist.record(sample.dns_us); }
        if sample.tcp_us > 0 { let _ = self.tcp_hist.record(sample.tcp_us); }
        if sample.tls_us > 0 { let _ = self.tls_hist.record(sample.tls_us); }
    }

    fn get_percentiles(hist: &Histogram<u64>) -> LatencyPercentiles {
        if hist.is_empty() {
            return LatencyPercentiles::default();
        }
        LatencyPercentiles {
            p50: hist.value_at_quantile(0.50) as f64 / 1000.0,   // Convert to ms for display
            p90: hist.value_at_quantile(0.90) as f64 / 1000.0,
            p95: hist.value_at_quantile(0.95) as f64 / 1000.0,
            p99: hist.value_at_quantile(0.99) as f64 / 1000.0,
            p999: hist.value_at_quantile(0.999) as f64 / 1000.0,
            avg: hist.mean() / 1000.0,
            min: hist.min() as f64 / 1000.0,
            max: hist.max() as f64 / 1000.0,
        }
    }

    pub fn generate_frame(&self, elapsed_sec: f64, current_vus: u32) -> LiveMetricsFrame {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let rps = if elapsed_sec > 0.0 {
            self.total_requests as f64 / elapsed_sec
        } else {
            0.0
        };

        let error_rate = if self.total_requests > 0 {
            (self.failed_requests as f64 / self.total_requests as f64) * 100.0
        } else {
            0.0
        };

        let bw_in = if elapsed_sec > 0.0 { self.total_bytes_in as f64 / elapsed_sec } else { 0.0 };
        let bw_out = if elapsed_sec > 0.0 { self.total_bytes_out as f64 / elapsed_sec } else { 0.0 };

        LiveMetricsFrame {
            timestamp: now,
            elapsed_seconds: elapsed_sec,
            current_vus,
            current_rps: rps,
            total_requests: self.total_requests,
            successful_requests: self.successful_requests,
            failed_requests: self.failed_requests,
            error_rate,
            bandwidth_in_bytes_per_sec: bw_in,
            bandwidth_out_bytes_per_sec: bw_out,
            latencies: MicrosecondMetrics {
                total_duration: Self::get_percentiles(&self.total_duration_hist),
                ttfb: Self::get_percentiles(&self.ttfb_hist),
                dns_resolution: Self::get_percentiles(&self.dns_hist),
                tcp_connect: Self::get_percentiles(&self.tcp_hist),
                tls_handshake: Self::get_percentiles(&self.tls_hist),
            },
            threshold_results: vec![],
        }
    }
}
