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
