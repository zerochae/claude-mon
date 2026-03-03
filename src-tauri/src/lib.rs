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
    tray::{TrayIconBuilder, TrayIconEvent},
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
    tool_use_id: String,
    state: State<'_, AppState>,
) -> Result<bool, String> {
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
    tool_use_id: String,
    reason: Option<String>,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    Ok(socket_server::respond_to_permission(
        tool_use_id,
        "deny".to_string(),
        reason,
        state.pending_permissions.clone(),
    )
    .await)
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
            }

            tauri::async_runtime::spawn(async move {
                socket_server::start_server(app_handle, sm, pp, tc).await;
            });

            setup_tray(app.handle())?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_sessions,
            approve_permission,
            deny_permission,
            get_chat_messages,
            settings::load_settings,
            settings::save_settings,
            set_vibrancy,
            set_accessory_mode,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn setup_tray(app: &AppHandle) -> tauri::Result<()> {
    let quit = MenuItemBuilder::with_id("quit", "Quit Claude House").build(app)?;
    let show = MenuItemBuilder::with_id("show", "Show / Hide").build(app)?;
    let menu = MenuBuilder::new(app).item(&show).item(&quit).build()?;

    TrayIconBuilder::new()
        .menu(&menu)
        .icon(app.default_window_icon().unwrap().clone())
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click { .. } = event {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    if window.is_visible().unwrap_or(false) {
                        let _ = window.hide();
                    } else {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
            }
        })
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

    Ok(())
}
