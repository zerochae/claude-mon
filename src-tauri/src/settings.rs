use std::fs;
use std::path::PathBuf;

fn settings_path() -> PathBuf {
    let config = dirs::config_dir().unwrap_or_else(|| PathBuf::from("."));
    config.join("claude-house").join("settings.json")
}

#[tauri::command]
pub fn load_settings() -> String {
    let path = settings_path();
    fs::read_to_string(path).unwrap_or_else(|_| "{}".to_string())
}

#[tauri::command]
pub fn save_settings(json: String) -> Result<(), String> {
    let path = settings_path();
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::write(path, json).map_err(|e| e.to_string())
}
