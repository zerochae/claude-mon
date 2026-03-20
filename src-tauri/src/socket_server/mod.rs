pub mod types;
pub mod handler;

pub use types::*;
pub use handler::respond_to_permission;

use crate::constants::*;

use std::collections::HashMap;
use std::sync::Arc;
use tokio::net::UnixListener;
use tokio::sync::Mutex;
use tauri::AppHandle;

use crate::session::SessionManager;

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
                    handler::handle_connection(
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
