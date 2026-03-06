mod chat;
mod hook_installer;
mod session;
mod settings;
mod socket_server;

use std::sync::Arc;
use tokio::sync::Mutex;
use tauri::{
    AppHandle, Manager, State,
    menu::{MenuBuilder, MenuItemBuilder},
    tray::TrayIconBuilder,
    window::{Effect, EffectState, EffectsBuilder},
};

use session::{SessionManager, SessionState};
use socket_server::{PendingPermissions, ToolUseIdCache};

pub struct AppState {
    pub session_manager: Arc<Mutex<SessionManager>>,
    pub pending_permissions: PendingPermissions,
    pub tool_use_id_cache: ToolUseIdCache,
}

#[tauri::command]
async fn get_sessions(state: State<'_, AppState>) -> Result<Vec<SessionState>, String> {
    let sm = state.session_manager.lock().await;
    Ok(sm.get_all_sessions().into_iter().cloned().collect())
}

#[tauri::command]
async fn approve_permission(
    session_id: String,
    tool_use_id: String,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    let _ = session_id;
    Ok(socket_server::respond_to_permission(
        tool_use_id,
        "allow".to_string(),
        None,
        state.pending_permissions.clone(),
    )
    .await)
}

#[tauri::command]
async fn deny_permission(
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
async fn send_message(
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

fn find_tmux_bin() -> Result<String, String> {
    let candidates = [
        "/opt/homebrew/bin/tmux",
        "/usr/local/bin/tmux",
        "/usr/bin/tmux",
        "/bin/tmux",
    ];
    for path in candidates {
        if std::path::Path::new(path).exists() {
            return Ok(path.to_string());
        }
    }
    Err("tmux not found".to_string())
}

fn find_tmux_target(tty_path: &str, pid: Option<u32>) -> Result<String, String> {
    let tmux = find_tmux_bin()?;
    let output = std::process::Command::new(&tmux)
        .args(["list-panes", "-a", "-F", "#{pane_tty} #{session_name}:#{window_index}.#{pane_index}"])
        .output()
        .map_err(|e| format!("tmux not available: {}", e))?;

    if !output.status.success() {
        return Err("tmux is not running".to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let panes: Vec<(&str, &str)> = stdout
        .lines()
        .filter_map(|line| {
            let mut parts = line.splitn(2, ' ');
            Some((parts.next()?, parts.next()?))
        })
        .collect();

    for &(tty, target) in &panes {
        if tty == tty_path {
            return Ok(target.to_string());
        }
    }

    if let Some(pid) = pid {
        let ancestor_ttys = collect_ancestor_ttys(pid);
        for ancestor_tty in &ancestor_ttys {
            for &(tty, target) in &panes {
                if tty == ancestor_tty {
                    return Ok(target.to_string());
                }
            }
        }
    }

    Err(format!("No tmux pane found for TTY {}", tty_path))
}

fn collect_ancestor_ttys(pid: u32) -> Vec<String> {
    let mut ttys = Vec::new();
    let mut current_pid = pid;
    for _ in 0..10 {
        let output = std::process::Command::new("ps")
            .args(["-o", "ppid=,tty=", "-p", &current_pid.to_string()])
            .output();
        let output = match output {
            Ok(o) if o.status.success() => o,
            _ => break,
        };
        let line = String::from_utf8_lossy(&output.stdout).trim().to_string();
        let mut parts = line.split_whitespace();
        let ppid: u32 = match parts.next().and_then(|s| s.parse().ok()) {
            Some(p) if p > 1 => p,
            _ => break,
        };
        if let Some(tty) = parts.next() {
            if tty != "??" && tty != "-" {
                let full_tty = if tty.starts_with("/dev/") {
                    tty.to_string()
                } else {
                    format!("/dev/{}", tty)
                };
                if !ttys.contains(&full_tty) {
                    ttys.push(full_tty);
                }
            }
        }
        current_pid = ppid;
    }
    ttys
}

#[tauri::command]
async fn get_chat_messages(
    session_id: String,
    cwd: String,
) -> Result<Vec<chat::ChatMessage>, String> {
    Ok(chat::parse_transcript(&cwd, &session_id))
}

#[tauri::command]
fn set_vibrancy(window: tauri::Window, effect: String) -> Result<(), String> {
    if effect == "none" {
        window
            .set_effects(EffectsBuilder::new().build())
            .map_err(|e| e.to_string())?;
        return Ok(());
    }

    let eff = match effect.as_str() {
        "sidebar" => Effect::Sidebar,
        "popover" => Effect::Popover,
        "hud" => Effect::HudWindow,
        "menu" => Effect::Menu,
        "header" => Effect::HeaderView,
        "sheet" => Effect::Sheet,
        "window" => Effect::WindowBackground,
        "under_window" => Effect::UnderWindowBackground,
        "under_page" => Effect::UnderPageBackground,
        "content" => Effect::ContentBackground,
        "tooltip" => Effect::Tooltip,
        "fullscreen" => Effect::FullScreenUI,
        "titlebar" => Effect::Titlebar,
        "selection" => Effect::Selection,
        _ => return Err(format!("unknown effect: {}", effect)),
    };

    window
        .set_effects(
            EffectsBuilder::new()
                .effect(eff)
                .state(EffectState::Active)
                .build(),
        )
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn set_accessory_mode(enabled: bool) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use objc2::MainThreadMarker;
        use objc2_app_kit::NSApplication;
        use objc2_app_kit::NSApplicationActivationPolicy;
        let mtm = MainThreadMarker::new().ok_or("not on main thread")?;
        let app_ns = NSApplication::sharedApplication(mtm);
        let policy = if enabled {
            NSApplicationActivationPolicy::Accessory
        } else {
            NSApplicationActivationPolicy::Regular
        };
        app_ns.setActivationPolicy(policy);
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let session_manager = Arc::new(Mutex::new(SessionManager::new()));
    let server = socket_server::SocketServer::new();
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
            get_sessions,
            approve_permission,
            deny_permission,
            send_message,
            get_chat_messages,
            settings::load_settings,
            settings::save_settings,
            set_vibrancy,
            set_accessory_mode,
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
