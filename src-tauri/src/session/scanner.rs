use std::collections::HashMap;

use super::types::SessionState;
use super::{extract_project_name, now_timestamp, SessionManager};

pub struct ProcessInfo {
    pub pid: u32,
    pub tty: Option<String>,
    pub cwd: String,
}

pub fn scan_existing_processes(manager: &mut SessionManager) {
    let output = match std::process::Command::new("ps")
        .args(["-eo", "pid,tty,comm"])
        .output()
    {
        Ok(o) => o,
        Err(_) => return,
    };
    let stdout = String::from_utf8_lossy(&output.stdout);

    let mut cwd_session_ids: HashMap<String, Vec<String>> = HashMap::new();

    let mut processes: Vec<ProcessInfo> = Vec::new();

    for line in stdout.lines() {
        let line = line.trim();
        if !line.ends_with("claude") {
            continue;
        }
        let parts: Vec<&str> = line.splitn(3, char::is_whitespace).collect();
        if parts.len() < 3 {
            continue;
        }
        let pid: u32 = match parts[0].trim().parse() {
            Ok(p) => p,
            Err(_) => continue,
        };
        let tty_raw = parts[1].trim();
        let tty = if tty_raw == "??" || tty_raw == "-" {
            None
        } else {
            Some(format!("/dev/{}", tty_raw))
        };

        let cwd = std::process::Command::new("lsof")
            .args(["-a", "-d", "cwd", "-Fn", "-p", &pid.to_string()])
            .output()
            .ok()
            .and_then(|o| {
                String::from_utf8_lossy(&o.stdout)
                    .lines()
                    .find(|l| l.starts_with('n'))
                    .map(|l| l[1..].to_string())
            })
            .unwrap_or_default();

        if !cwd_session_ids.contains_key(&cwd) {
            cwd_session_ids.insert(cwd.clone(), find_recent_session_ids(&cwd));
        }

        processes.push(ProcessInfo { pid, tty, cwd });
    }

    for proc in processes {
        let session_id = cwd_session_ids
            .get_mut(&proc.cwd)
            .and_then(|ids| {
                let pos = ids.iter().position(|id| !manager.sessions.contains_key(id))?;
                Some(ids.remove(pos))
            })
            .unwrap_or_else(|| format!("scan-{}", proc.pid));

        if manager.sessions.contains_key(&session_id) {
            continue;
        }
        let color = manager.pick_color();
        manager.sessions.insert(
            session_id.clone(),
            SessionState {
                session_id: session_id.clone(),
                cwd: proc.cwd.clone(),
                project_name: extract_project_name(&proc.cwd),
                phase: "waiting_for_input".to_string(),
                tool_name: None,
                tool_input: None,
                tool_use_id: None,
                pid: Some(proc.pid),
                tty: proc.tty,
                subagent_count: 0,
                color_index: color,
                last_activity: now_timestamp().saturating_sub(86400),
                context_remaining_pct: None,
                context_used_tokens: None,
                context_max_tokens: None,
            },
        );
        eprintln!("[scan] discovered claude pid={} session={} cwd={}", proc.pid, session_id, proc.cwd);
    }
}

pub fn find_recent_session_ids(cwd: &str) -> Vec<String> {
    let home = match dirs::home_dir() {
        Some(h) => h,
        None => return Vec::new(),
    };
    let projects_dir = home.join(".claude").join("projects");
    let encoded = cwd.replace('/', "-").replace('.', "-");
    let dir = projects_dir.join(&encoded);
    if !dir.is_dir() {
        return Vec::new();
    }
    let mut entries: Vec<(std::time::SystemTime, String)> = Vec::new();
    if let Ok(rd) = std::fs::read_dir(&dir) {
        for entry in rd.flatten() {
            let path = entry.path();
            if path.extension().and_then(|e| e.to_str()) != Some("jsonl") {
                continue;
            }
            if let (Some(name), Ok(meta)) = (
                path.file_stem().and_then(|n| n.to_str()).map(|s| s.to_string()),
                entry.metadata(),
            ) {
                if let Ok(mtime) = meta.modified() {
                    entries.push((mtime, name));
                }
            }
        }
    }
    entries.sort_by(|a, b| b.0.cmp(&a.0));
    entries.into_iter().map(|(_, id)| id).collect()
}
