pub mod scanner;
pub mod types;

pub use types::*;

use crate::constants::*;

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
                phase: PHASE_IDLE.to_string(),
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
            PHASE_PROCESSING => {
                session.phase = PHASE_PROCESSING.to_string();
                session.tool_name = event.tool.clone();
                session.tool_input = event.tool_input.clone();
            }
            PHASE_RUNNING_TOOL => {
                session.phase = PHASE_RUNNING_TOOL.to_string();
                session.tool_name = event.tool.clone();
                session.tool_input = event.tool_input.clone();
                session.tool_use_id = tool_use_id_override.or_else(|| event.tool_use_id.clone());
            }
            PHASE_WAITING_FOR_APPROVAL => {
                session.phase = PHASE_WAITING_FOR_APPROVAL.to_string();
                session.tool_name = event.tool.clone();
                session.tool_input = event.tool_input.clone();
                session.tool_use_id = tool_use_id_override.or_else(|| event.tool_use_id.clone());
            }
            PHASE_WAITING_FOR_INPUT => {
                session.phase = PHASE_WAITING_FOR_INPUT.to_string();
                session.tool_name = None;
                session.tool_input = None;
                session.tool_use_id = None;
            }
            PHASE_COMPACTING => {
                session.phase = PHASE_COMPACTING.to_string();
            }
            PHASE_ENDED => {
                session.phase = PHASE_ENDED.to_string();
                session.tool_name = None;
                session.tool_input = None;
                session.tool_use_id = None;
            }
            PHASE_NOTIFICATION => {
                session.phase = PHASE_NOTIFICATION.to_string();
            }
            EVENT_SUBAGENT_STARTED => {
                session.subagent_count = session.subagent_count.saturating_add(1);
            }
            EVENT_SUBAGENT_STOPPED => {
                session.subagent_count = session.subagent_count.saturating_sub(1);
                if session.subagent_count == 0 {
                    session.phase = PHASE_WAITING_FOR_INPUT.to_string();
                }
            }
            EVENT_STATUSLINE => {}
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
            s.phase != PHASE_ENDED || now.saturating_sub(s.last_activity) < max_age_secs
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::socket_server::HookEvent;

    fn make_event(session_id: &str, status: &str) -> HookEvent {
        HookEvent {
            session_id: session_id.to_string(),
            event: "test".to_string(),
            cwd: Some("/home/user/project".to_string()),
            status: Some(status.to_string()),
            tool: None,
            tool_input: None,
            tool_use_id: None,
            pid: None,
            tty: None,
            notification_type: None,
            message: None,
            context_window: None,
            model_id: None,
        }
    }

    #[test]
    fn pick_color_returns_unused_color_when_slots_available() {
        let mut mgr = SessionManager::new();
        let first = mgr.pick_color();
        assert!(first < NUM_COLORS);

        let mut event = make_event("s1", PHASE_PROCESSING);
        event.pid = None;
        mgr.process_event(&event, None);
        let s1_color = mgr.sessions["s1"].color_index;

        let second = mgr.pick_color();
        assert_ne!(second, s1_color);
    }

    #[test]
    fn pick_color_returns_least_used_when_all_slots_taken() {
        let mut mgr = SessionManager::new();
        for i in 0..NUM_COLORS {
            let mut event = make_event(&format!("s{}", i), PHASE_PROCESSING);
            event.pid = None;
            mgr.process_event(&event, None);
        }
        let color = mgr.pick_color();
        assert!(color < NUM_COLORS);
    }

    #[test]
    fn process_event_creates_new_session_with_processing_phase() {
        let mut mgr = SessionManager::new();
        let mut event = make_event("abc", PHASE_PROCESSING);
        event.pid = None;
        mgr.process_event(&event, None);

        let session = mgr.sessions.get("abc").unwrap();
        assert_eq!(session.session_id, "abc");
        assert_eq!(session.phase, PHASE_PROCESSING);
    }

    #[test]
    fn process_event_updates_phase_on_subsequent_event() {
        let mut mgr = SessionManager::new();
        let mut event = make_event("abc", PHASE_PROCESSING);
        event.pid = None;
        mgr.process_event(&event, None);

        let mut event2 = make_event("abc", PHASE_WAITING_FOR_INPUT);
        event2.pid = None;
        mgr.process_event(&event2, None);

        assert_eq!(mgr.sessions["abc"].phase, PHASE_WAITING_FOR_INPUT);
    }

    #[test]
    fn process_event_subagent_started_increments_count() {
        let mut mgr = SessionManager::new();
        let mut event = make_event("abc", PHASE_PROCESSING);
        event.pid = None;
        mgr.process_event(&event, None);

        let mut ev = make_event("abc", EVENT_SUBAGENT_STARTED);
        ev.pid = None;
        mgr.process_event(&ev, None);
        mgr.process_event(&ev, None);

        assert_eq!(mgr.sessions["abc"].subagent_count, 2);
    }

    #[test]
    fn process_event_subagent_stopped_decrements_count_and_sets_waiting() {
        let mut mgr = SessionManager::new();
        let mut event = make_event("abc", PHASE_PROCESSING);
        event.pid = None;
        mgr.process_event(&event, None);

        let mut start = make_event("abc", EVENT_SUBAGENT_STARTED);
        start.pid = None;
        mgr.process_event(&start, None);

        let mut stop = make_event("abc", EVENT_SUBAGENT_STOPPED);
        stop.pid = None;
        mgr.process_event(&stop, None);

        let session = &mgr.sessions["abc"];
        assert_eq!(session.subagent_count, 0);
        assert_eq!(session.phase, PHASE_WAITING_FOR_INPUT);
    }

    #[test]
    fn process_event_subagent_stopped_does_not_underflow() {
        let mut mgr = SessionManager::new();
        let mut event = make_event("abc", PHASE_PROCESSING);
        event.pid = None;
        mgr.process_event(&event, None);

        let mut stop = make_event("abc", EVENT_SUBAGENT_STOPPED);
        stop.pid = None;
        mgr.process_event(&stop, None);

        assert_eq!(mgr.sessions["abc"].subagent_count, 0);
    }

    #[test]
    fn cleanup_stale_ended_removes_old_ended_sessions() {
        let mut mgr = SessionManager::new();
        let old_ts = now_timestamp().saturating_sub(120);
        mgr.sessions.insert(
            "old".to_string(),
            SessionState {
                session_id: "old".to_string(),
                cwd: "/tmp".to_string(),
                project_name: "tmp".to_string(),
                phase: PHASE_ENDED.to_string(),
                tool_name: None,
                tool_input: None,
                tool_use_id: None,
                pid: None,
                tty: None,
                subagent_count: 0,
                color_index: 0,
                last_activity: old_ts,
                context_remaining_pct: None,
                context_used_tokens: None,
                context_max_tokens: None,
            },
        );
        mgr.cleanup_stale_ended(60);
        assert!(!mgr.sessions.contains_key("old"));
    }

    #[test]
    fn cleanup_stale_ended_retains_recent_ended_sessions() {
        let mut mgr = SessionManager::new();
        let recent_ts = now_timestamp();
        mgr.sessions.insert(
            "recent".to_string(),
            SessionState {
                session_id: "recent".to_string(),
                cwd: "/tmp".to_string(),
                project_name: "tmp".to_string(),
                phase: PHASE_ENDED.to_string(),
                tool_name: None,
                tool_input: None,
                tool_use_id: None,
                pid: None,
                tty: None,
                subagent_count: 0,
                color_index: 0,
                last_activity: recent_ts,
                context_remaining_pct: None,
                context_used_tokens: None,
                context_max_tokens: None,
            },
        );
        mgr.cleanup_stale_ended(60);
        assert!(mgr.sessions.contains_key("recent"));
    }

    #[test]
    fn cleanup_stale_ended_retains_non_ended_sessions_regardless_of_age() {
        let mut mgr = SessionManager::new();
        let old_ts = now_timestamp().saturating_sub(9999);
        mgr.sessions.insert(
            "active".to_string(),
            SessionState {
                session_id: "active".to_string(),
                cwd: "/tmp".to_string(),
                project_name: "tmp".to_string(),
                phase: PHASE_PROCESSING.to_string(),
                tool_name: None,
                tool_input: None,
                tool_use_id: None,
                pid: None,
                tty: None,
                subagent_count: 0,
                color_index: 0,
                last_activity: old_ts,
                context_remaining_pct: None,
                context_used_tokens: None,
                context_max_tokens: None,
            },
        );
        mgr.cleanup_stale_ended(60);
        assert!(mgr.sessions.contains_key("active"));
    }

    #[test]
    fn process_event_inherits_color_from_scan_session() {
        let mut mgr = SessionManager::new();
        let pid: u32 = 99999;
        let scan_key = format!("scan-{}", pid);
        mgr.sessions.insert(
            scan_key.clone(),
            SessionState {
                session_id: scan_key.clone(),
                cwd: "/tmp".to_string(),
                project_name: "tmp".to_string(),
                phase: PHASE_IDLE.to_string(),
                tool_name: None,
                tool_input: None,
                tool_use_id: None,
                pid: Some(pid),
                tty: None,
                subagent_count: 0,
                color_index: 7,
                last_activity: now_timestamp(),
                context_remaining_pct: None,
                context_used_tokens: None,
                context_max_tokens: None,
            },
        );

        let mut event = make_event("real-session", PHASE_PROCESSING);
        event.pid = Some(pid);
        mgr.process_event(&event, None);

        assert!(!mgr.sessions.contains_key(&scan_key));
        assert_eq!(mgr.sessions["real-session"].color_index, 7);
    }
}
