pub mod graphql;
pub mod grpc;
pub mod http1;
pub mod http2;
pub mod http3;
pub mod mqtt;
pub mod smtp_imap;
pub mod tcp_udp;
pub mod websocket;

use super::metrics::RequestSample;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};

fn default_auth_type() -> String { "none".to_string() }
fn default_body_type() -> String { "none".to_string() }
fn default_timeout_ms() -> u64 { 10000 }

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct KeyValuePair {
    pub key: String,
    pub value: String,
    #[serde(default)]
    pub enabled: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthConfig {
    #[serde(alias = "type", alias = "auth_type", alias = "authType", default = "default_auth_type")]
    pub auth_type: String, // none, basic, bearer, api_key
    #[serde(default)]
    pub username: Option<String>,
    #[serde(default)]
    pub password: Option<String>,
    #[serde(default)]
    pub token: Option<String>,
    #[serde(alias = "api_key_header", alias = "apiKeyHeader", default)]
    pub api_key_header: Option<String>,
    #[serde(alias = "api_key_value", alias = "apiKeyValue", default)]
    pub api_key_value: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RequestSpec {
    pub id: String,
    pub name: String,
    pub protocol: String,
    pub method: String,
    pub url: String,
    #[serde(default)]
    pub headers: Vec<KeyValuePair>,
    #[serde(alias = "query_params", alias = "queryParams", default)]
    pub query_params: Vec<KeyValuePair>,
    #[serde(default)]
    pub cookies: Vec<KeyValuePair>,
    #[serde(alias = "body_type", alias = "bodyType", default = "default_body_type")]
    pub body_type: String,
    #[serde(default)]
    pub body: Option<String>,
    #[serde(default)]
    pub auth: Option<AuthConfig>,
    #[serde(alias = "timeout_ms", alias = "timeoutMs", default = "default_timeout_ms")]
    pub timeout_ms: u64,
    #[serde(default)]
    pub extractors: Option<serde_json::Value>,
    #[serde(default)]
    pub assertions: Option<serde_json::Value>,
}

#[async_trait]
pub trait ProtocolClient: Send + Sync {
    async fn execute(&self, req: &RequestSpec) -> RequestSample;
}
