use std::fs;
use std::path::PathBuf;
use serde_json::Value;
use tauri::Manager;


const HOOK_SCRIPT_NAME: &str = "claude-mon-state.py";
const HOOK_IDENTIFIER: &str = "claude-mon-state.py";
const STATUSLINE_SCRIPT_NAME: &str = "claude-mon-statusline.py";
const STATUSLINE_IDENTIFIER: &str = "claude-mon-statusline.py";

pub fn install_hooks(app: &tauri::AppHandle) {
    let resource_path = match get_resource_path(app) {
        Some(p) if p.exists() => {
            eprintln!("[hooks] resource found: {:?}", p);
            p
        }
        Some(p) => {
            eprintln!("[hooks] resource path does not exist: {:?}", p);
            return;
        }
        None => {
            eprintln!("[hooks] failed to resolve resource dir");
            return;
        }
    };

    let claude_dir = home_dir().join(".claude");
    let hooks_dir = claude_dir.join("hooks");
    let script_dest = hooks_dir.join(HOOK_SCRIPT_NAME);
    let settings_path = claude_dir.join("settings.json");

    let _ = fs::create_dir_all(&hooks_dir);

    let _ = fs::remove_file(&script_dest);
    match fs::copy(&resource_path, &script_dest) {
        Ok(_) => {
            eprintln!("[hooks] copied to {:?}", script_dest);
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                let _ = fs::set_permissions(&script_dest, fs::Permissions::from_mode(0o755));
            }
        }
        Err(e) => {
            eprintln!("[hooks] copy failed: {}", e);
            return;
        }
    }

    let statusline_resource = get_resource_path_for(app, STATUSLINE_SCRIPT_NAME);
    if let Some(src) = statusline_resource {
        let statusline_dest = hooks_dir.join(STATUSLINE_SCRIPT_NAME);
        let _ = fs::remove_file(&statusline_dest);
        if let Ok(_) = fs::copy(&src, &statusline_dest) {
            eprintln!("[hooks] statusline copied to {:?}", statusline_dest);
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                let _ = fs::set_permissions(&statusline_dest, fs::Permissions::from_mode(0o755));
            }
        }
    }

    update_settings(&settings_path);
    eprintln!("[hooks] settings updated: {:?}", settings_path);
}

fn update_settings(settings_path: &PathBuf) {
    let mut json: Value = fs::read_to_string(settings_path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_else(|| Value::Object(Default::default()));

    let command = format!("python3 ~/.claude/hooks/{}", HOOK_SCRIPT_NAME);

    let hook_entry = serde_json::json!([{"type": "command", "command": command}]);
    let hook_entry_timeout = serde_json::json!([{"type": "command", "command": command, "timeout": 86400}]);

    let with_matcher = serde_json::json!([{"matcher": "*", "hooks": hook_entry}]);
    let with_matcher_timeout = serde_json::json!([{"matcher": "*", "hooks": hook_entry_timeout}]);
    let without_matcher = serde_json::json!([{"hooks": hook_entry}]);
    let pre_compact = serde_json::json!([
        {"matcher": "auto", "hooks": hook_entry},
        {"matcher": "manual", "hooks": hook_entry}
    ]);

    let hook_events: Vec<(&str, Value)> = vec![
        ("UserPromptSubmit", without_matcher.clone()),
        ("PreToolUse", with_matcher.clone()),
        ("PostToolUse", with_matcher.clone()),
        ("PermissionRequest", with_matcher_timeout),
        ("Notification", with_matcher),
        ("Stop", without_matcher.clone()),
        ("SubagentStart", without_matcher.clone()),
        ("SubagentStop", without_matcher.clone()),
        ("SessionStart", without_matcher.clone()),
        ("SessionEnd", without_matcher),
        ("PreCompact", pre_compact),
    ];

    let Some(root) = json.as_object_mut() else {
        return;
    };
    let hooks = root
        .entry("hooks")
        .or_insert_with(|| Value::Object(Default::default()));

    let Some(hooks_obj) = hooks.as_object_mut() else {
        return;
    };

    for (event, config) in hook_events {
        if let Some(existing) = hooks_obj.get_mut(event) {
            if let Some(arr) = existing.as_array_mut() {
                let already_registered = arr.iter().any(|e| entry_has_our_hook(e));
                if !already_registered {
                    if let Some(new_entries) = config.as_array() {
                        arr.extend(new_entries.iter().cloned());
                    }
                }
            }
        } else {
            hooks_obj.insert(event.to_string(), config);
        }
    }

    let statusline_cmd = format!("python3 ~/.claude/hooks/{}", STATUSLINE_SCRIPT_NAME);
    let existing_statusline = root.get("statusline").and_then(|v| v.as_str()).unwrap_or("");
    if !existing_statusline.contains(STATUSLINE_IDENTIFIER) {
        root.insert("statusline".to_string(), Value::String(statusline_cmd));
    }

    if let Ok(output) = serde_json::to_string_pretty(&json) {
        let _ = fs::write(settings_path, output);
    }
}

fn entry_has_our_hook(entry: &Value) -> bool {
    entry
        .get("hooks")
        .and_then(|h| h.as_array())
        .map(|hooks| {
            hooks.iter().any(|hook| {
                hook.get("command")
                    .and_then(|c| c.as_str())
                    .map(|cmd| cmd.contains(HOOK_IDENTIFIER))
                    .unwrap_or(false)
            })
        })
        .unwrap_or(false)
}

fn home_dir() -> PathBuf {
    dirs::home_dir().unwrap_or_else(|| PathBuf::from("/tmp"))
}

fn get_resource_path(app: &tauri::AppHandle) -> Option<PathBuf> {
    get_resource_path_for(app, HOOK_SCRIPT_NAME)
}

fn get_resource_path_for(app: &tauri::AppHandle, name: &str) -> Option<PathBuf> {
    let bundled = app.path()
        .resource_dir()
        .ok()
        .map(|dir| dir.join(name));

    if let Some(ref p) = bundled {
        if p.exists() {
            return bundled;
        }
    }

    let dev_path = app.path()
        .resource_dir()
        .ok()
        .and_then(|dir| dir.parent().and_then(|p| p.parent()).map(|p| p.to_path_buf()))
        .map(|dir| dir.join("resources").join(name));

    dev_path
}
