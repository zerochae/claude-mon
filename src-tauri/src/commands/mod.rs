pub mod types;

pub use types::*;

use tauri::State;

use crate::chat;
use crate::errors::AppError;
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
            .ok_or_else(|| -> String { AppError::SessionNotFound.into() })?;

        if session.phase != crate::constants::PHASE_WAITING_FOR_INPUT {
            return Err(AppError::SessionNotWaitingForInput.into());
        }

        let path = session
            .tty
            .as_ref()
            .ok_or_else(|| -> String { AppError::NoTtyAvailable.into() })?
            .clone();

        if !path.starts_with("/dev/tty") && !path.starts_with("/dev/pts/") {
            return Err(AppError::InvalidTtyPath(path).into());
        }

        (path, session.pid)
    };

    tokio::task::spawn_blocking(move || {
        let tmux = find_tmux_bin()?;
        let target = find_tmux_target(&tty_path, pid)?;

        std::process::Command::new(&tmux)
            .args(["send-keys", "-t", &target, "-l", &message])
            .output()
            .map_err(|e| -> String { AppError::TmuxSendText(e.to_string()).into() })?;

        std::process::Command::new(&tmux)
            .args(["send-keys", "-t", &target, "Enter"])
            .output()
            .map_err(|e| -> String { AppError::TmuxSendEnter(e.to_string()).into() })?;

        Ok(true)
    })
    .await
    .map_err(|e| -> String { AppError::JoinError(e.to_string()).into() })?
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

#[tauri::command]
pub async fn get_git_info(cwd: String) -> Result<GitInfo, String> {
    tokio::task::spawn_blocking(move || {
        let branch = std::process::Command::new("git")
            .args(["rev-parse", "--abbrev-ref", "HEAD"])
            .current_dir(&cwd)
            .output()
            .ok()
            .filter(|o| o.status.success())
            .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string());

        let diff = std::process::Command::new("git")
            .args(["diff", "--shortstat"])
            .current_dir(&cwd)
            .output()
            .ok()
            .filter(|o| o.status.success())
            .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
            .unwrap_or_default();

        let mut changed_files = 0u32;
        let mut added = 0u32;
        let mut removed = 0u32;

        for part in diff.split(',') {
            let trimmed = part.trim();
            if trimmed.contains("file") {
                changed_files = trimmed.split_whitespace().next()
                    .and_then(|n| n.parse().ok()).unwrap_or(0);
            } else if trimmed.contains("insertion") {
                added = trimmed.split_whitespace().next()
                    .and_then(|n| n.parse().ok()).unwrap_or(0);
            } else if trimmed.contains("deletion") {
                removed = trimmed.split_whitespace().next()
                    .and_then(|n| n.parse().ok()).unwrap_or(0);
            }
        }

        Ok(GitInfo { branch, added, removed, changed_files })
    })
    .await
    .map_err(|e| -> String { AppError::JoinError(e.to_string()).into() })?
}
