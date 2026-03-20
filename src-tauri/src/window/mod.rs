use crate::errors::AppError;
use tauri::window::{Effect, EffectState, EffectsBuilder};

#[tauri::command]
pub fn set_vibrancy(window: tauri::Window, effect: String) -> Result<(), String> {
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
        _ => return Err(AppError::UnknownEffect(effect).into()),
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
pub fn set_accessory_mode(enabled: bool) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use objc2::MainThreadMarker;
        use objc2_app_kit::NSApplication;
        use objc2_app_kit::NSApplicationActivationPolicy;
        let mtm = MainThreadMarker::new().ok_or::<String>(AppError::NotMainThread.into())?;
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
