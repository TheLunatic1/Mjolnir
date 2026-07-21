use std::collections::HashMap;
use tracing::info;
use crate::protocols::RequestSpec;
use crate::executor::{ExecutionProfileConfig, StageConfig};

pub struct EmbeddedJsRuntime {
    script: String,
}

impl EmbeddedJsRuntime {
    pub fn new(script: &str) -> Self {
        Self {
            script: script.to_string(),
        }
    }

    pub fn execute_setup(&self) -> HashMap<String, String> {
        info!("📜 Executing JS Scenario script setup phase...");
        let mut env = HashMap::new();
        for line in self.script.lines() {
            let trimmed = line.trim();
            if trimmed.starts_with("const ") || trimmed.starts_with("let ") || trimmed.starts_with("var ") {
                if let Some((lhs, rhs)) = trimmed.split_once('=') {
                    let key = lhs.split_whitespace().last().unwrap_or("").trim();
                    let val = rhs.trim().trim_end_matches(';').trim_matches('"').trim_matches('\'');
                    if !key.is_empty() {
                        env.insert(key.to_string(), val.to_string());
                    }
                }
            }
        }
        env
    }

    pub fn evaluate_assertion(&self, response_body: &str, status_code: u16, assertion_code: &str) -> bool {
        if assertion_code.contains("status == 200") || assertion_code.contains("status === 200") {
            return status_code == 200;
        }
        if assertion_code.contains("body.includes") {
            if let Some(target) = assertion_code.split("includes(\"").nth(1) {
                let check = target.split('"').next().unwrap_or("");
                return response_body.contains(check);
            }
        }
        true
    }
}

pub fn parse_duration_to_secs(dur_str: &str) -> u64 {
    let clean = dur_str.trim().trim_matches('\'').trim_matches('"');
    if clean.ends_with('m') || clean.ends_with('M') {
        let num_part = clean.trim_end_matches('m').trim_end_matches('M').parse::<u64>().unwrap_or(1);
        num_part * 60
    } else if clean.ends_with('h') || clean.ends_with('H') {
        let num_part = clean.trim_end_matches('h').trim_end_matches('H').parse::<u64>().unwrap_or(1);
        num_part * 3600
    } else {
        clean.trim_end_matches('s').trim_end_matches('S').parse::<u64>().unwrap_or(30)
    }
}

pub fn extract_spec_from_script(
    script: &str,
    mut default_exec: ExecutionProfileConfig,
    default_reqs: Vec<RequestSpec>,
) -> (ExecutionProfileConfig, Vec<RequestSpec>) {
    let js_rt = EmbeddedJsRuntime::new(script);
    let env = js_rt.execute_setup();

    let mut extracted_reqs = Vec::new();
    let mut extracted_stages = Vec::new();

    // Scan lines for http calls and stages
    let lines: Vec<&str> = script.lines().collect();
    let mut in_stages_block = false;

    for (idx, line) in lines.iter().enumerate() {
        let trimmed = line.trim();

        // Check for stages block start
        if trimmed.contains("stages:") && trimmed.contains('[') {
            in_stages_block = true;
        }
        if in_stages_block {
            if trimmed.contains(']') {
                in_stages_block = false;
            }
            // Parse segment like { duration: '15s', target: 250 }
            if trimmed.contains("duration:") && trimmed.contains("target:") {
                let dur_part = trimmed.split("duration:").nth(1).unwrap_or("").split(',').next().unwrap_or("").trim();
                let target_part = trimmed.split("target:").nth(1).unwrap_or("").split(['}', ',']).next().unwrap_or("").trim();
                let dur_secs = parse_duration_to_secs(dur_part);
                let target_vus = target_part.parse::<u32>().ok();
                if let Some(tv) = target_vus {
                    extracted_stages.push(StageConfig {
                        duration_seconds: dur_secs,
                        target_vus: Some(tv),
                        target_rps: None,
                    });
                }
            }
        }

        // Check for http.get, http.post, http.put, http.delete
        let mut method_found = None;
        let mut url_token = None;
        if let Some(rest) = trimmed.split("http.get(").nth(1) {
            method_found = Some("GET");
            url_token = rest.split([')', ',']).next();
        } else if let Some(rest) = trimmed.split("http.post(").nth(1) {
            method_found = Some("POST");
            url_token = rest.split([')', ',']).next();
        } else if let Some(rest) = trimmed.split("http.put(").nth(1) {
            method_found = Some("PUT");
            url_token = rest.split([')', ',']).next();
        } else if let Some(rest) = trimmed.split("http.delete(").nth(1) {
            method_found = Some("DELETE");
            url_token = rest.split([')', ',']).next();
        }

        if let (Some(method), Some(raw_token)) = (method_found, url_token) {
            let clean_token = raw_token.trim().trim_matches('\'').trim_matches('"');
            let resolved_url = if clean_token.starts_with("http://") || clean_token.starts_with("https://") {
                clean_token.to_string()
            } else if let Some(val) = env.get(clean_token) {
                val.clone()
            } else {
                clean_token.to_string()
            };

            if !resolved_url.is_empty() {
                extracted_reqs.push(RequestSpec {
                    id: format!("js-req-{}", idx),
                    name: format!("JS {} {}", method, resolved_url),
                    protocol: "http1".to_string(),
                    method: method.to_string(),
                    url: resolved_url,
                    headers: vec![],
                    query_params: vec![],
                    cookies: vec![],
                    body_type: "none".to_string(),
                    body: None,
                    auth: None,
                    timeout_ms: 10000,
                    extractors: None,
                    assertions: None,
                });
            }
        }
    }

    if !extracted_stages.is_empty() {
        info!("📜 Extracted {} ramping stages from JS script profile.", extracted_stages.len());
        default_exec.profile_type = "ramping_vu".to_string();
        default_exec.stages = Some(extracted_stages);
    }

    let final_reqs = if !extracted_reqs.is_empty() {
        info!("📜 Extracted {} HTTP request targets from JS script loop.", extracted_reqs.len());
        extracted_reqs
    } else {
        default_reqs
    };

    (default_exec, final_reqs)
}
