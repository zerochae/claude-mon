mod chat;
mod commands;
mod hook_installer;
mod session;
mod settings;
mod socket_server;
mod tmux;
mod tray;
mod usage;
mod window;

use std::sync::Arc;
use tokio::sync::Mutex;
use tauri::Manager;

use session::SessionManager;
use socket_server::SocketServer;

pub struct AppState {
    pub session_manager: Arc<Mutex<SessionManager>>,
    pub pending_permissions: socket_server::PendingPermissions,
    pub tool_use_id_cache: socket_server::ToolUseIdCache,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let session_manager = Arc::new(Mutex::new(SessionManager::new()));
    let server = SocketServer::new();
    let pending_permissions = server.pending_permissions.clone();
    let tool_use_id_cache = server.tool_use_id_cache.clone();

    let app_state = AppState {
        session_manager: session_manager.clone(),
        pending_permissions: pending_permissions.clone(),
        tool_use_id_cache: tool_use_id_cache.clone(),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(app_state)
        .setup(move |app| {
            let app_handle = app.handle().clone();
            let sm = session_manager.clone();
            let pp = pending_permissions.clone();
            let tc = tool_use_id_cache.clone();

            hook_installer::install_hooks(&app_handle);

            {
                let mut sm = sm.blocking_lock();
                sm.scan_existing_processes();
            }

            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_shadow(false);
                #[cfg(debug_assertions)]
                window.open_devtools();

                #[cfg(target_os = "macos")]
                {
                    use objc2::runtime::AnyObject;
                    use objc2::msg_send;

                    if let Ok(ns_window_ptr) = window.ns_window() {
                        unsafe {
                            let ns_win: &AnyObject = &*(ns_window_ptr as *const AnyObject);
                            let _: () = msg_send![ns_win, setAcceptsMouseMovedEvents: true];
                            let _: () = msg_send![ns_win, setMovable: false];
                        }
                    }
                }
            }

            tauri::async_runtime::spawn(async move {
                socket_server::start_server(app_handle, sm, pp, tc).await;
            });

            let sm_tray = session_manager.clone();
            tray::setup_tray(app.handle(), sm_tray)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_sessions,
            commands::approve_permission,
            commands::deny_permission,
            commands::send_message,
            commands::get_chat_messages,
            commands::get_session_stats,
            commands::get_claude_usage,
            commands::get_git_info,
            settings::load_settings,
            settings::save_settings,
            window::set_vibrancy,
            window::set_accessory_mode,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
