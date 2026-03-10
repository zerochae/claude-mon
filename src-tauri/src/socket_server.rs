use std::collections::HashMap;
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::UnixListener;
use tokio::sync::Mutex;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::{AppHandle, Emitter};

use crate::session::SessionManager;

pub const SOCKET_PATH: &str = "/tmp/claude-mon.sock";

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

pub struct SocketServer {
    pub pending_permissions: PendingPermissions,
    pub tool_use_id_cache: ToolUseIdCache,
}

impl SocketServer {
    pub fn new() -> Self {
        Self {
            pending_permissions: Arc::new(Mutex::new(HashMap::new())),
            tool_use_id_cache: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}

pub async fn start_server(
    app: AppHandle,
    session_manager: Arc<Mutex<SessionManager>>,
    pending_permissions: PendingPermissions,
    tool_use_id_cache: ToolUseIdCache,
) {
    let _ = std::fs::remove_file(SOCKET_PATH);

    let listener = match UnixListener::bind(SOCKET_PATH) {
        Ok(l) => l,
        Err(e) => {
            eprintln!("Failed to bind socket: {}", e);
            return;
        }
    };

    loop {
        match listener.accept().await {
            Ok((stream, _)) => {
                let app = app.clone();
                let session_manager = session_manager.clone();
                let pending_permissions = pending_permissions.clone();
                let tool_use_id_cache = tool_use_id_cache.clone();

                tokio::spawn(async move {
                    handle_connection(
                        stream,
                        app,
                        session_manager,
                        pending_permissions,
                        tool_use_id_cache,
                    )
                    .await;
                });
            }
            Err(e) => {
                eprintln!("Accept error: {}", e);
            }
        }
    }
}

async fn handle_connection(
    mut stream: tokio::net::UnixStream,
    app: AppHandle,
    session_manager: Arc<Mutex<SessionManager>>,
    pending_permissions: PendingPermissions,
    tool_use_id_cache: ToolUseIdCache,
) {
    let mut buf = Vec::new();
    let mut tmp = [0u8; 4096];

    loop {
        match stream.read(&mut tmp).await {
            Ok(0) => break,
            Ok(n) => buf.extend_from_slice(&tmp[..n]),
            Err(_) => return,
        }
        if buf.len() > 65536 {
            break;
        }
        if !tmp[..].is_empty() {
            if let Ok(_) = serde_json::from_slice::<Value>(&buf) {
                break;
            }
        }
    }

    let event: HookEvent = match serde_json::from_slice(&buf) {
        Ok(e) => e,
        Err(_) => return,
    };

    let session_id = event.session_id.clone();
    let status = event.status.clone().unwrap_or_default();
    eprintln!("[socket] event={} session={} status={}", event.event, &session_id[..8.min(session_id.len())], status);

    if event.event == "PreToolUse" {
        if let Some(tool_use_id) = &event.tool_use_id {
            let mut cache = tool_use_id_cache.lock().await;
            cache.insert(session_id.clone(), tool_use_id.clone());
        }
    }

    if event.event == "PostToolUse" {
        if let Some(tool_use_id) = &event.tool_use_id {
            let mut perms = pending_permissions.lock().await;
            if perms.remove(tool_use_id).is_some() {
                let mut sm = session_manager.lock().await;
                if let Some(s) = sm.get_session_mut(&session_id) {
                    if s.phase == "waiting_for_approval" {
                        s.phase = "processing".to_string();
                        s.tool_use_id = None;
                    }
                }
                drop(sm);
                let _ = app.emit("session-updated", get_sessions_payload(&session_manager).await);
            }
        }
    }

    if status == "waiting_for_approval" {
        let tool_use_id = {
            let cache = tool_use_id_cache.lock().await;
            cache.get(&session_id).cloned().unwrap_or_else(|| {
                format!("perm-{}", now_timestamp())
            })
        };

        let (tx, rx) = tokio::sync::oneshot::channel::<PermissionResponse>();

        {
            let mut perms = pending_permissions.lock().await;
            perms.insert(
                tool_use_id.clone(),
                PendingPermission {
                    sender: tx,
                    tool_use_id: tool_use_id.clone(),
                },
            );
        }

        {
            let mut sm = session_manager.lock().await;
            sm.process_event(&event, Some(tool_use_id.clone()));
        }

        let _ = app.emit("session-updated", get_sessions_payload(&session_manager).await);
        let _ = app.emit("permission-request", serde_json::json!({
            "session_id": session_id,
            "tool_use_id": tool_use_id,
            "tool": event.tool,
            "tool_input": event.tool_input,
        }));

        let mut eof_buf = [0u8; 1];
        tokio::select! {
            result = rx => {
                if let Ok(response) = result {
                    let output = build_permission_output(&response);
                    let _ = stream.write_all(output.as_bytes()).await;
                }
            }
            _ = stream.read(&mut eof_buf) => {
                {
                    let mut sm = session_manager.lock().await;
                    if let Some(s) = sm.get_session_mut(&session_id) {
                        if s.phase == "waiting_for_approval" {
                            s.phase = "processing".to_string();
                            s.tool_use_id = None;
                        }
                    }
                }
                {
                    let mut perms = pending_permissions.lock().await;
                    perms.remove(&tool_use_id);
                }
                let _ = app.emit("session-updated", get_sessions_payload(&session_manager).await);
            }
        }

        return;
    }

    {
        let mut sm = session_manager.lock().await;
        if let Some(s) = sm.get_session(&session_id) {
            if s.phase == "waiting_for_approval" {
                if let Some(tid) = &s.tool_use_id {
                    let mut perms = pending_permissions.lock().await;
                    perms.remove(tid);
                }
            }
        }
        sm.process_event(&event, None);
    }

    let payload = get_sessions_payload(&session_manager).await;
    let count = payload.as_array().map(|a| a.len()).unwrap_or(0);
    eprintln!("[socket] emitting session-updated with {} sessions", count);
    let _ = app.emit("session-updated", payload);
}

fn build_permission_output(response: &PermissionResponse) -> String {
    let output = if response.decision == "allow" {
        serde_json::json!({
            "decision": "allow"
        })
    } else {
        serde_json::json!({
            "decision": "deny",
            "reason": response.reason.as_deref().unwrap_or("Denied by user via ClaudeMon")
        })
    };
    output.to_string()
}

async fn get_sessions_payload(session_manager: &Arc<Mutex<SessionManager>>) -> Value {
    let sm = session_manager.lock().await;
    serde_json::to_value(sm.get_all_sessions()).unwrap_or(Value::Null)
}

pub async fn respond_to_permission(
    tool_use_id: String,
    decision: String,
    reason: Option<String>,
    pending_permissions: PendingPermissions,
) -> bool {
    let mut perms = pending_permissions.lock().await;
    if let Some(pending) = perms.remove(&tool_use_id) {
        let _ = pending.sender.send(PermissionResponse { decision, reason });
        true
    } else {
        false
    }
}

fn now_timestamp() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}
