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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeyValuePair {
    pub key: String,
    pub value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthConfig {
    pub auth_type: String, // none, basic, bearer, api_key
    pub username: Option<String>,
    pub password: Option<String>,
    pub token: Option<String>,
    pub api_key_header: Option<String>,
    pub api_key_value: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RequestSpec {
    pub id: String,
    pub name: String,
    pub protocol: String,
    pub method: String,
    pub url: String,
    pub headers: Vec<KeyValuePair>,
    pub query_params: Vec<KeyValuePair>,
    pub cookies: Vec<KeyValuePair>,
    pub body_type: String,
    pub body: Option<String>,
    pub auth: Option<AuthConfig>,
    pub timeout_ms: u64,
}

#[async_trait]
pub trait ProtocolClient: Send + Sync {
    async fn execute(&self, req: &RequestSpec) -> RequestSample;
}
