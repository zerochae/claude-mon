use std::collections::HashMap;
use std::fs;

use super::format::format_tool_content;
use super::path::{find_transcript_path, is_system_message, parse_timestamp};
use super::types::{ChatMessage, ContentBlock, JsonlEntry};

fn parse_user_message(
    uuid: String,
    timestamp: u64,
    content: &serde_json::Value,
    tool_id_to_index: &mut HashMap<String, usize>,
    messages: &mut Vec<ChatMessage>,
) {
    match content {
        serde_json::Value::String(s) => {
            if !s.is_empty() && !is_system_message(s) {
                messages.push(ChatMessage {
                    id: uuid,
                    role: "user".to_string(),
                    content: s.clone(),
                    tool_name: None,
                    tool_status: None,
                    tool_output: None,
                    subagent_type: None,
                    subagent_prompt: None,
                    timestamp,
                });
            }
        }
        serde_json::Value::Array(arr) => {
            let mut text_parts = Vec::new();
            for block in arr {
                if let Ok(b) = serde_json::from_value::<ContentBlock>(block.clone()) {
                    match b.block_type.as_str() {
                        "text" => {
                            if let Some(t) = &b.text {
                                if !is_system_message(t) {
                                    text_parts.push(t.clone());
                                }
                            }
                        }
                        "tool_result" => {
                            if let Some(tid) = b.tool_use_id {
                                let output = match &b.content {
                                    Some(serde_json::Value::String(s)) => Some(s.clone()),
                                    Some(serde_json::Value::Array(arr)) => {
                                        let parts: Vec<String> = arr
                                            .iter()
                                            .filter_map(|v| {
                                                v.get("text")
                                                    .and_then(|t| t.as_str())
                                                    .map(|s| s.to_string())
                                            })
                                            .collect();
                                        if parts.is_empty() { None } else { Some(parts.join("\n")) }
                                    }
                                    _ => None,
                                };
                                if let Some(out) = output {
                                    if let Some(&idx) = tool_id_to_index.get(&tid) {
                                        messages[idx].tool_output = Some(out);
                                    }
                                }
                            }
                        }
                        _ => {}
                    }
                }
            }
            if !text_parts.is_empty() {
                let combined = text_parts.join("\n");
                messages.push(ChatMessage {
                    id: uuid,
                    role: "user".to_string(),
                    content: combined,
                    tool_name: None,
                    tool_status: None,
                    tool_output: None,
                    subagent_type: None,
                    subagent_prompt: None,
                    timestamp,
                });
            }
        }
        _ => {}
    }
}

fn parse_assistant_message(
    uuid: String,
    timestamp: u64,
    content: &serde_json::Value,
    tool_id_to_index: &mut HashMap<String, usize>,
    messages: &mut Vec<ChatMessage>,
) {
    if let serde_json::Value::Array(arr) = content {
        let mut text_parts = Vec::new();
        let mut tool_uses: Vec<(String, String, Option<String>, Option<String>, Option<String>)> =
            Vec::new();

        for block in arr {
            if let Ok(b) = serde_json::from_value::<ContentBlock>(block.clone()) {
                match b.block_type.as_str() {
                    "text" => {
                        if let Some(t) = b.text {
                            if !t.is_empty() {
                                text_parts.push(t);
                            }
                        }
                    }
                    "tool_use" => {
                        let name = b.name.unwrap_or_else(|| "unknown".to_string());
                        let content = format_tool_content(&name, &b.input);
                        let tool_id = b.id;
                        let (agent_type, agent_prompt) = if name == "Agent" || name == "Task" {
                            let at = b
                                .input
                                .as_ref()
                                .and_then(|v| v.get("subagent_type"))
                                .and_then(|v| v.as_str())
                                .map(|s| s.to_string());
                            let ap = b
                                .input
                                .as_ref()
                                .and_then(|v| v.get("prompt"))
                                .and_then(|v| v.as_str())
                                .map(|s| s.to_string());
                            (at, ap)
                        } else {
                            (None, None)
                        };
                        tool_uses.push((name, content, agent_type, agent_prompt, tool_id));
                    }
                    _ => {}
                }
            }
        }

        if !text_parts.is_empty() {
            let combined = text_parts.join("\n");
            messages.push(ChatMessage {
                id: format!("{}-text", uuid),
                role: "assistant".to_string(),
                content: combined,
                tool_name: None,
                tool_status: None,
                tool_output: None,
                subagent_type: None,
                subagent_prompt: None,
                timestamp,
            });
        }

        for (i, (name, input_str, agent_type, agent_prompt, tool_id)) in
            tool_uses.into_iter().enumerate()
        {
            let msg_idx = messages.len();
            if let Some(tid) = tool_id {
                tool_id_to_index.insert(tid, msg_idx);
            }
            messages.push(ChatMessage {
                id: format!("{}-tool-{}", uuid, i),
                role: "tool".to_string(),
                content: input_str,
                tool_name: Some(name),
                tool_status: Some("done".to_string()),
                tool_output: None,
                subagent_type: agent_type,
                subagent_prompt: agent_prompt,
                timestamp,
            });
        }
    }
}

pub fn parse_transcript(cwd: &str, session_id: &str) -> Vec<ChatMessage> {
    let path = match find_transcript_path(cwd, session_id) {
        Some(p) => p,
        None => return Vec::new(),
    };
    let content = match fs::read_to_string(&path) {
        Ok(c) => c,
        Err(_) => return Vec::new(),
    };

    let mut messages = Vec::new();
    let mut tool_id_to_index: HashMap<String, usize> = HashMap::new();

    for line in content.lines() {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }

        let entry: JsonlEntry = match serde_json::from_str(line) {
            Ok(e) => e,
            Err(_) => continue,
        };

        let uuid = entry.uuid.unwrap_or_default();
        let timestamp = entry
            .timestamp
            .as_deref()
            .map(parse_timestamp)
            .unwrap_or(0);

        match entry.entry_type.as_str() {
            "user" => {
                if let Some(msg) = entry.message {
                    parse_user_message(
                        uuid,
                        timestamp,
                        &msg.content,
                        &mut tool_id_to_index,
                        &mut messages,
                    );
                }
            }
            "assistant" => {
                if let Some(msg) = entry.message {
                    parse_assistant_message(
                        uuid,
                        timestamp,
                        &msg.content,
                        &mut tool_id_to_index,
                        &mut messages,
                    );
                }
            }
            _ => {}
        }
    }

    messages
}
