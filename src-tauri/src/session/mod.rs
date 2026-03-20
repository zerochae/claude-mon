pub mod constants;
pub mod scanner;
pub mod types;

pub use constants::*;
pub use types::*;

use std::collections::HashMap;
use std::time::{SystemTime, UNIX_EPOCH};

use crate::socket_server::HookEvent;

pub struct SessionManager {
    pub(crate) sessions: HashMap<String, SessionState>,
}

impl SessionManager {
    pub fn new() -> Self {
        Self {
            sessions: HashMap::new(),
        }
    }

    pub(crate) fn pick_color(&self) -> usize {
        let used: std::collections::HashSet<usize> = self
            .sessions
            .values()
            .map(|s| s.color_index)
            .collect();
        (0..NUM_COLORS)
            .find(|i| !used.contains(i))
            .unwrap_or_else(|| {
                let mut counts = [0usize; NUM_COLORS];
                for s in self.sessions.values() {
                    counts[s.color_index % NUM_COLORS] += 1;
                }
                counts
                    .iter()
                    .enumerate()
                    .min_by_key(|(_, c)| *c)
                    .map(|(i, _)| i)
                    .unwrap_or(0)
            })
    }

    pub fn scan_existing_processes(&mut self) {
        scanner::scan_existing_processes(self);
    }

    pub fn process_event(&mut self, event: &HookEvent, tool_use_id_override: Option<String>) {
        let now = now_timestamp();
        let session_id = &event.session_id;

        let inherited_color = event.pid.and_then(|pid| {
            let scan_key = format!("scan-{}", pid);
            self.sessions.remove(&scan_key).map(|s| s.color_index)
        });

        let color = inherited_color.unwrap_or_else(|| self.pick_color());
        let session = self.sessions.entry(session_id.clone()).or_insert_with(|| {
            SessionState {
                session_id: session_id.clone(),
                cwd: event.cwd.clone().unwrap_or_default(),
                project_name: extract_project_name(event.cwd.as_deref().unwrap_or("")),
                phase: "idle".to_string(),
                tool_name: None,
                tool_input: None,
                tool_use_id: None,
                pid: event.pid,
                tty: event.tty.clone(),
                subagent_count: 0,
                color_index: color,
                last_activity: now,
                context_remaining_pct: None,
                context_used_tokens: None,
                context_max_tokens: None,
            }
        });

        session.last_activity = now;

        if let Some(cwd) = &event.cwd {
            if !cwd.is_empty() {
                session.cwd = cwd.clone();
                session.project_name = extract_project_name(cwd);
            }
        }

        if let Some(pid) = event.pid {
            session.pid = Some(pid);
        }

        if let Some(tty) = &event.tty {
            if !tty.is_empty() {
                session.tty = Some(tty.clone());
            }
        }

        let status = event.status.as_deref().unwrap_or("");

        match status {
            "processing" => {
                session.phase = "processing".to_string();
                session.tool_name = event.tool.clone();
                session.tool_input = event.tool_input.clone();
            }
            "running_tool" => {
                session.phase = "running_tool".to_string();
                session.tool_name = event.tool.clone();
                session.tool_input = event.tool_input.clone();
                session.tool_use_id = tool_use_id_override.or_else(|| event.tool_use_id.clone());
            }
            "waiting_for_approval" => {
                session.phase = "waiting_for_approval".to_string();
                session.tool_name = event.tool.clone();
                session.tool_input = event.tool_input.clone();
                session.tool_use_id = tool_use_id_override.or_else(|| event.tool_use_id.clone());
            }
            "waiting_for_input" => {
                session.phase = "waiting_for_input".to_string();
                session.tool_name = None;
                session.tool_input = None;
                session.tool_use_id = None;
            }
            "compacting" => {
                session.phase = "compacting".to_string();
            }
            "ended" => {
                session.phase = "ended".to_string();
                session.tool_name = None;
                session.tool_input = None;
                session.tool_use_id = None;
            }
            "notification" => {
                session.phase = "notification".to_string();
            }
            "subagent_started" => {
                session.subagent_count = session.subagent_count.saturating_add(1);
            }
            "subagent_stopped" => {
                session.subagent_count = session.subagent_count.saturating_sub(1);
                if session.subagent_count == 0 {
                    session.phase = "waiting_for_input".to_string();
                }
            }
            "statusline" => {}
            _ => {}
        }

        if let Some(ctx) = &event.context_window {
            session.context_remaining_pct = ctx.remaining_percentage;
            session.context_used_tokens = ctx.used_tokens;
            session.context_max_tokens = ctx.max_tokens;
        }

        self.cleanup_stale_ended(60);
    }

    pub fn get_all_sessions(&self) -> Vec<&SessionState> {
        self.sessions.values().collect()
    }

    pub fn get_session(&self, session_id: &str) -> Option<&SessionState> {
        self.sessions.get(session_id)
    }

    pub fn get_session_mut(&mut self, session_id: &str) -> Option<&mut SessionState> {
        self.sessions.get_mut(session_id)
    }

    pub fn cleanup_stale_ended(&mut self, max_age_secs: u64) {
        let now = now_timestamp();
        self.sessions.retain(|_, s| {
            s.phase != "ended" || now.saturating_sub(s.last_activity) < max_age_secs
        });
    }
}

pub(crate) fn extract_project_name(cwd: &str) -> String {
    if cwd.is_empty() {
        return "Unknown".to_string();
    }
    std::path::Path::new(cwd)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("Unknown")
        .to_string()
}

pub(crate) fn now_timestamp() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}
