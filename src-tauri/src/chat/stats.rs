use std::fs;

use super::path::find_transcript_path;
use super::types::{JsonlEntry, SessionStats};

fn context_window_for_model(model: &str) -> u64 {
    if model.contains("opus-4-6") || model.contains("opus-4-5") {
        1_000_000
    } else if model.contains("sonnet-4-6") || model.contains("sonnet-4-5") {
        1_000_000
    } else {
        200_000
    }
}

pub fn parse_session_stats(cwd: &str, session_id: &str) -> SessionStats {
    let mut stats = SessionStats {
        model: None,
        total_input_tokens: 0,
        total_output_tokens: 0,
        total_cache_read_tokens: 0,
        total_cache_write_tokens: 0,
        context_window: 200_000,
        current_context_tokens: 0,
        message_count: 0,
    };

    let path = match find_transcript_path(cwd, session_id) {
        Some(p) => p,
        None => return stats,
    };
    let content = match fs::read_to_string(&path) {
        Ok(c) => c,
        Err(_) => return stats,
    };

    for line in content.lines() {
        let line = line.trim();
        if line.is_empty() { continue; }

        let entry: JsonlEntry = match serde_json::from_str(line) {
            Ok(e) => e,
            Err(_) => continue,
        };

        if entry.entry_type == "assistant" {
            if let Some(msg) = &entry.message {
                if let Some(model) = &msg.model {
                    if stats.model.is_none() {
                        stats.context_window = context_window_for_model(model);
                    }
                    stats.model = Some(model.clone());
                }
                if let Some(usage) = &msg.usage {
                    let input = usage.input_tokens.unwrap_or(0);
                    let cache_read = usage.cache_read_input_tokens.unwrap_or(0);
                    let cache_write = usage.cache_creation_input_tokens.unwrap_or(0);
                    stats.total_input_tokens += input;
                    stats.total_output_tokens += usage.output_tokens.unwrap_or(0);
                    stats.total_cache_read_tokens += cache_read;
                    stats.total_cache_write_tokens += cache_write;
                    stats.current_context_tokens = input + cache_read + cache_write;
                }
                stats.message_count += 1;
            }
        }
    }

    stats
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn context_window_for_model_returns_1m_for_opus_4_6() {
        assert_eq!(context_window_for_model("claude-opus-4-6"), 1_000_000);
    }

    #[test]
    fn context_window_for_model_returns_1m_for_opus_4_5() {
        assert_eq!(context_window_for_model("claude-opus-4-5"), 1_000_000);
    }

    #[test]
    fn context_window_for_model_returns_1m_for_sonnet_4_6() {
        assert_eq!(context_window_for_model("claude-sonnet-4-6"), 1_000_000);
    }

    #[test]
    fn context_window_for_model_returns_1m_for_sonnet_4_5() {
        assert_eq!(context_window_for_model("claude-sonnet-4-5"), 1_000_000);
    }

    #[test]
    fn context_window_for_model_returns_200k_for_unknown_model() {
        assert_eq!(context_window_for_model("claude-haiku-3-5"), 200_000);
    }

    #[test]
    fn context_window_for_model_returns_200k_for_empty_string() {
        assert_eq!(context_window_for_model(""), 200_000);
    }
}
