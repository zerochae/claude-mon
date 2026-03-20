use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionState {
    pub session_id: String,
    pub cwd: String,
    pub project_name: String,
    pub phase: String,
    pub tool_name: Option<String>,
    pub tool_input: Option<Value>,
    pub tool_use_id: Option<String>,
    pub pid: Option<u32>,
    pub tty: Option<String>,
    pub subagent_count: u32,
    pub color_index: usize,
    pub last_activity: u64,
    pub context_remaining_pct: Option<f64>,
    pub context_used_tokens: Option<u64>,
    pub context_max_tokens: Option<u64>,
}
