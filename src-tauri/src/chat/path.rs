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
mod tests {
    use super::*;

    #[test]
    fn is_system_message_returns_true_for_task_notification_tag() {
        assert!(is_system_message("<task-notification>hello</task-notification>"));
    }

    #[test]
    fn is_system_message_returns_true_for_system_reminder_tag() {
        assert!(is_system_message("<system-reminder>some content</system-reminder>"));
    }

    #[test]
    fn is_system_message_returns_true_for_local_command_tag() {
        assert!(is_system_message("<local-command foo=\"bar\">"));
    }

    #[test]
    fn is_system_message_returns_true_for_command_name_tag() {
        assert!(is_system_message("<command-name>do-thing</command-name>"));
    }

    #[test]
    fn is_system_message_returns_false_for_regular_text() {
        assert!(!is_system_message("Hello, world!"));
    }

    #[test]
    fn is_system_message_returns_false_for_empty_string() {
        assert!(!is_system_message(""));
    }

    #[test]
    fn is_system_message_returns_true_with_leading_whitespace() {
        assert!(is_system_message("  <system-reminder>x</system-reminder>"));
    }

    #[test]
    fn parse_timestamp_parses_valid_rfc3339_timestamp() {
        let ts = "2024-01-15T10:30:00Z";
        let result = parse_timestamp(ts);
        assert!(result > 0);
    }

    #[test]
    fn parse_timestamp_parses_rfc3339_with_offset() {
        let ts = "2024-01-15T10:30:00+09:00";
        let result = parse_timestamp(ts);
        assert!(result > 0);
    }

    #[test]
    fn parse_timestamp_returns_zero_for_invalid_input() {
        assert_eq!(parse_timestamp("not-a-date"), 0);
    }

    #[test]
    fn parse_timestamp_returns_zero_for_empty_string() {
        assert_eq!(parse_timestamp(""), 0);
    }

    #[test]
    fn parse_timestamp_returns_millis_not_seconds() {
        let ts = "2024-01-15T00:00:00Z";
        let result = parse_timestamp(ts);
        assert!(result > 1_000_000_000_000);
    }
}
