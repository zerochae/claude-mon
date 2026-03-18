use tauri::State;

use crate::chat;
use crate::session::SessionState;
use crate::socket_server;
use crate::tmux::{find_tmux_bin, find_tmux_target};
use crate::usage;
use crate::AppState;

#[tauri::command]
pub async fn get_sessions(state: State<'_, AppState>) -> Result<Vec<SessionState>, String> {
    let sm = state.session_manager.lock().await;
    Ok(sm.get_all_sessions().into_iter().cloned().collect())
}

#[tauri::command]
pub async fn approve_permission(
    session_id: String,
    tool_use_id: String,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    let result = socket_server::respond_to_permission(
        tool_use_id,
        "allow".to_string(),
        None,
        state.pending_permissions.clone(),
    )
    .await;

    if result {
        let tty_and_pid = {
            let sm = state.session_manager.lock().await;
            sm.get_session(&session_id).and_then(|s| {
                let tty = s.tty.as_ref()?;
                if tty.starts_with("/dev/tty") || tty.starts_with("/dev/pts/") {
                    Some((tty.clone(), s.pid))
                } else {
                    None
                }
            })
        };

        if let Some((tty_path, pid)) = tty_and_pid {
            let _ = tokio::task::spawn_blocking(move || {
                if let Ok(tmux) = find_tmux_bin() {
                    if let Ok(target) = find_tmux_target(&tty_path, pid) {
                        let _ = std::process::Command::new(&tmux)
                            .args(["send-keys", "-t", &target, "Enter"])
                            .output();
                    }
                }
            })
            .await;
        }
    }

    Ok(result)
}

#[tauri::command]
pub async fn deny_permission(
    session_id: String,
    tool_use_id: String,
    reason: Option<String>,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    let _ = session_id;
    Ok(socket_server::respond_to_permission(
        tool_use_id,
        "deny".to_string(),
        reason,
        state.pending_permissions.clone(),
    )
    .await)
}

#[tauri::command]
pub async fn send_message(
    session_id: String,
    message: String,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    let (tty_path, pid) = {
        let sm = state.session_manager.lock().await;
        let session = sm
            .get_session(&session_id)
            .ok_or_else(|| "Session not found".to_string())?;

        if session.phase != "waiting_for_input" {
            return Err("Session is not waiting for input".to_string());
        }

        let path = session
            .tty
            .as_ref()
            .ok_or_else(|| "No TTY available for this session".to_string())?
            .clone();

        if !path.starts_with("/dev/tty") && !path.starts_with("/dev/pts/") {
            return Err(format!("Invalid TTY path: {}", path));
        }

        (path, session.pid)
    };

    tokio::task::spawn_blocking(move || {
        let tmux = find_tmux_bin()?;
        let target = find_tmux_target(&tty_path, pid)?;

        std::process::Command::new(&tmux)
            .args(["send-keys", "-t", &target, "-l", &message])
            .output()
            .map_err(|e| format!("Failed to send text via tmux: {}", e))?;

        std::process::Command::new(&tmux)
            .args(["send-keys", "-t", &target, "Enter"])
            .output()
            .map_err(|e| format!("Failed to send Enter via tmux: {}", e))?;

        Ok(true)
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

#[tauri::command]
pub async fn get_chat_messages(
    session_id: String,
    cwd: String,
) -> Result<Vec<chat::ChatMessage>, String> {
    Ok(chat::parse_transcript(&cwd, &session_id))
}

#[tauri::command]
pub async fn get_session_stats(
    session_id: String,
    cwd: String,
) -> Result<chat::SessionStats, String> {
    Ok(chat::parse_session_stats(&cwd, &session_id))
}

#[tauri::command]
pub async fn get_claude_usage() -> Result<usage::ClaudeUsage, String> {
    usage::fetch_usage().await
}
