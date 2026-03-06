mod chat;
mod commands;
mod hook_installer;
mod session;
mod settings;
mod socket_server;
mod tmux;
mod window;

use std::sync::Arc;
use tokio::sync::Mutex;
use tauri::{
    AppHandle, Manager,
    menu::{MenuBuilder, MenuItemBuilder},
    tray::TrayIconBuilder,
};

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
            setup_tray(app.handle(), sm_tray)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_sessions,
            commands::approve_permission,
            commands::deny_permission,
            commands::send_message,
            commands::get_chat_messages,
            commands::get_session_stats,
            settings::load_settings,
            settings::save_settings,
            window::set_vibrancy,
            window::set_accessory_mode,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn decode_png(bytes: &[u8]) -> tauri::image::Image<'static> {
    let decoder = png::Decoder::new(bytes);
    let mut reader = decoder.read_info().unwrap();
    let mut buf = vec![0; reader.output_buffer_size()];
    let info = reader.next_frame(&mut buf).unwrap();
    buf.truncate(info.buffer_size());
    tauri::image::Image::new_owned(buf, info.width, info.height)
}

fn setup_tray(app: &AppHandle, _session_manager: Arc<Mutex<SessionManager>>) -> tauri::Result<()> {
    let quit = MenuItemBuilder::with_id("quit", "Quit ClaudeMon").build(app)?;
    let show = MenuItemBuilder::with_id("show", "Show / Hide").build(app)?;
    let menu = MenuBuilder::new(app).item(&show).item(&quit).build()?;

    let frames: Vec<tauri::image::Image<'static>> = vec![
        decode_png(include_bytes!("../icons/tray_frame_0.png")),
        decode_png(include_bytes!("../icons/tray_frame_1.png")),
        decode_png(include_bytes!("../icons/tray_frame_2.png")),
        decode_png(include_bytes!("../icons/tray_frame_3.png")),
        decode_png(include_bytes!("../icons/tray_frame_4.png")),
        decode_png(include_bytes!("../icons/tray_frame_5.png")),
        decode_png(include_bytes!("../icons/tray_frame_6.png")),
        decode_png(include_bytes!("../icons/tray_frame_7.png")),
    ];

    let tray = TrayIconBuilder::new()
        .menu(&menu)
        .icon(frames[0].clone())
        .icon_as_template(true)
        .show_menu_on_left_click(true)
        .on_menu_event(|app, event| match event.id().as_ref() {
            "quit" => {
                app.exit(0);
            }
            "show" => {
                if let Some(window) = app.get_webview_window("main") {
                    if window.is_visible().unwrap_or(false) {
                        let _ = window.hide();
                    } else {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
            }
            _ => {}
        })
        .build(app)?;

    drop(tray);

    Ok(())
}
