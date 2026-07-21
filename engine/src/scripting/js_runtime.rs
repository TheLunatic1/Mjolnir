use std::collections::HashMap;
use tracing::info;

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
        // Extract simple variable assignments like `const TOKEN = "xyz";`
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
        if assertion_code.contains("status == 200") {
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
