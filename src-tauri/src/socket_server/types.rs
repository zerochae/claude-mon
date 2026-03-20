use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Deserialize, Clone)]
pub struct HookEvent {
    pub session_id: String,
    pub event: String,
    pub cwd: Option<String>,
    pub status: Option<String>,
    pub tool: Option<String>,
    pub tool_input: Option<Value>,
    pub tool_use_id: Option<String>,
    pub pid: Option<u32>,
    pub tty: Option<String>,
    pub notification_type: Option<String>,
    pub message: Option<String>,
    pub context_window: Option<ContextWindowInfo>,
    pub model_id: Option<String>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct ContextWindowInfo {
    pub remaining_percentage: Option<f64>,
    pub used_tokens: Option<u64>,
    pub max_tokens: Option<u64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PermissionResponse {
    pub decision: String,
    pub reason: Option<String>,
}

pub struct PendingPermission {
    pub sender: tokio::sync::oneshot::Sender<PermissionResponse>,
    pub tool_use_id: String,
}

pub type PendingPermissions = Arc<Mutex<HashMap<String, PendingPermission>>>;
pub type ToolUseIdCache = Arc<Mutex<HashMap<String, String>>>;
