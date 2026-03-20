use std::fs;
use std::path::PathBuf;

pub fn is_system_message(s: &str) -> bool {
    let trimmed = s.trim();
    trimmed.starts_with("<task-notification>")
        || trimmed.starts_with("<system-reminder>")
        || trimmed.starts_with("<local-command")
        || trimmed.starts_with("<command-name>")
}

pub fn find_transcript_path(cwd: &str, session_id: &str) -> Option<PathBuf> {
    let home = dirs::home_dir()?;
    let projects_dir = home.join(".claude").join("projects");
    let filename = format!("{}.jsonl", session_id);

    let encoded = cwd.replace('/', "-").replace('.', "-");
    let direct = projects_dir.join(&encoded).join(&filename);
    if direct.exists() {
        return Some(direct);
    }

    let mut search_cwd = cwd.to_string();
    while !search_cwd.is_empty() {
        let encoded = search_cwd.replace('/', "-").replace('.', "-");
        let path = projects_dir.join(&encoded).join(&filename);
        if path.exists() {
            return Some(path);
        }
        if let Some(pos) = search_cwd.rfind('/') {
            search_cwd.truncate(pos);
        } else {
            break;
        }
    }

    if let Ok(entries) = fs::read_dir(&projects_dir) {
        for entry in entries.flatten() {
            let path = entry.path().join(&filename);
            if path.exists() {
                return Some(path);
            }
        }
    }

    None
}

pub fn parse_timestamp(ts: &str) -> u64 {
    chrono::DateTime::parse_from_rfc3339(ts)
        .map(|dt| dt.timestamp_millis() as u64)
        .unwrap_or(0)
}

#[cfg(test)]
#[path = "path_tests.rs"]
mod path_tests;
