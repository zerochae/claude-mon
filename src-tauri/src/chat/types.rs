use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize)]
pub struct ChatMessage {
    pub id: String,
    pub role: String,
    pub content: String,
    pub tool_name: Option<String>,
    pub tool_status: Option<String>,
    pub tool_output: Option<String>,
    pub subagent_type: Option<String>,
    pub subagent_prompt: Option<String>,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize)]
pub struct SessionStats {
    pub model: Option<String>,
    pub total_input_tokens: u64,
    pub total_output_tokens: u64,
    pub total_cache_read_tokens: u64,
    pub total_cache_write_tokens: u64,
    pub context_window: u64,
    pub current_context_tokens: u64,
    pub message_count: u32,
}

#[derive(Deserialize)]
pub struct JsonlEntry {
    #[serde(rename = "type")]
    pub entry_type: String,
    pub message: Option<MessagePayload>,
    pub uuid: Option<String>,
    pub timestamp: Option<String>,
}

#[derive(Deserialize)]
pub struct MessagePayload {
    pub content: serde_json::Value,
    pub model: Option<String>,
    pub usage: Option<UsagePayload>,
}

#[derive(Deserialize)]
pub struct UsagePayload {
    pub input_tokens: Option<u64>,
    pub output_tokens: Option<u64>,
    pub cache_creation_input_tokens: Option<u64>,
    pub cache_read_input_tokens: Option<u64>,
}

#[derive(Deserialize)]
pub struct ContentBlock {
    #[serde(rename = "type")]
    pub block_type: String,
    pub text: Option<String>,
    pub name: Option<String>,
    pub id: Option<String>,
    pub input: Option<serde_json::Value>,
    pub tool_use_id: Option<String>,
    pub content: Option<serde_json::Value>,
}
