use super::{LiveMetricsFrame, ThresholdResult};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThresholdRule {
    pub metric: String,
    pub aggregation: String,
    pub operator: String,
    pub value: f64,
    pub abort_on_fail: Option<bool>,
}

pub struct ThresholdEvaluator {
    rules: Vec<ThresholdRule>,
}

impl ThresholdEvaluator {
    pub fn new(rules: Vec<ThresholdRule>) -> Self {
        Self { rules }
    }

    pub fn evaluate(&self, frame: &LiveMetricsFrame) -> (Vec<ThresholdResult>, bool) {
        let mut results = Vec::new();
        let mut should_abort = false;

        for rule in &self.rules {
            let current_val = self.extract_value(frame, &rule.metric, &rule.aggregation);
            let passed = match rule.operator.as_str() {
                "<" => current_val < rule.value,
                "<=" => current_val <= rule.value,
                ">" => current_val > rule.value,
                ">=" => current_val >= rule.value,
                "==" => (current_val - rule.value).abs() < f64::EPSILON,
                _ => false,
            };

            results.push(ThresholdResult {
                rule: format!("{} {} {} {}", rule.metric, rule.aggregation, rule.operator, rule.value),
                passed,
                current_value: current_val,
            });

            if !passed && rule.abort_on_fail.unwrap_or(false) {
                should_abort = true;
            }
        }

        (results, should_abort)
    }

    fn extract_value(&self, frame: &LiveMetricsFrame, metric: &str, agg: &str) -> f64 {
        match metric {
            "http_req_duration" | "total_duration" => self.extract_lat(&frame.latencies.total_duration, agg),
            "ttfb" => self.extract_lat(&frame.latencies.ttfb, agg),
            "dns" => self.extract_lat(&frame.latencies.dns_resolution, agg),
            "tcp" => self.extract_lat(&frame.latencies.tcp_connect, agg),
            "tls" => self.extract_lat(&frame.latencies.tls_handshake, agg),
            "http_req_failed" | "error_rate" => frame.error_rate,
            "rps" => frame.current_rps,
            "bandwidth" => frame.bandwidth_in_bytes_per_sec + frame.bandwidth_out_bytes_per_sec,
            _ => 0.0,
        }
    }

    fn extract_lat(&self, lat: &super::LatencyPercentiles, agg: &str) -> f64 {
        match agg {
            "p50" => lat.p50,
            "p90" => lat.p90,
            "p95" => lat.p95,
            "p99" => lat.p99,
            "p999" | "p99.9" => lat.p999,
            "avg" | "mean" => lat.avg,
            "min" => lat.min,
            "max" => lat.max,
            _ => lat.p95,
        }
    }
}
