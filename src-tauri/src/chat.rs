use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize)]
pub struct ChatMessage {
    pub id: String,
    pub role: String,
    pub content: String,
    pub tool_name: Option<String>,
    pub tool_status: Option<String>,
    pub subagent_type: Option<String>,
    pub subagent_prompt: Option<String>,
    pub timestamp: u64,
}

#[derive(Deserialize)]
struct JsonlEntry {
    #[serde(rename = "type")]
    entry_type: String,
    message: Option<MessagePayload>,
    uuid: Option<String>,
    timestamp: Option<String>,
}

#[derive(Deserialize)]
struct MessagePayload {
    content: serde_json::Value,
}

#[derive(Deserialize)]
struct ContentBlock {
    #[serde(rename = "type")]
    block_type: String,
    text: Option<String>,
    name: Option<String>,
    input: Option<serde_json::Value>,
}

fn find_transcript_path(cwd: &str, session_id: &str) -> Option<PathBuf> {
    let home = dirs::home_dir()?;
    let projects_dir = home.join(".claude").join("projects");
    let filename = format!("{}.jsonl", session_id);

    let encoded = cwd.replace('/', "-");
    let direct = projects_dir.join(&encoded).join(&filename);
    if direct.exists() {
        return Some(direct);
    }

    let mut search_cwd = cwd.to_string();
    while !search_cwd.is_empty() {
        let encoded = search_cwd.replace('/', "-");
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

fn parse_timestamp(ts: &str) -> u64 {
    chrono::DateTime::parse_from_rfc3339(ts)
        .map(|dt| dt.timestamp_millis() as u64)
        .unwrap_or(0)
}

fn get_str<'a>(v: &'a serde_json::Value, key: &str) -> &'a str {
    v.get(key).and_then(|v| v.as_str()).unwrap_or("")
}

fn format_tool_content(name: &str, input: &Option<serde_json::Value>) -> String {
    let Some(v) = input else {
        return String::new();
    };

    match name {
        "Read" => {
            let path = get_str(v, "file_path");
            let mut out = format!("`{path}`");
            if let Some(offset) = v.get("offset").and_then(|v| v.as_u64()) {
                out.push_str(&format!(" L{offset}"));
                if let Some(limit) = v.get("limit").and_then(|v| v.as_u64()) {
                    out.push_str(&format!("-{}", offset + limit));
                }
            }
            out
        }
        "Edit" => {
            let path = get_str(v, "file_path");
            let ext = std::path::Path::new(path)
                .extension()
                .and_then(|e| e.to_str())
                .unwrap_or("");
            let old = get_str(v, "old_string");
            let new_s = get_str(v, "new_string");
            let old_lines: Vec<&str> = old.lines().collect();
            let new_lines: Vec<&str> = new_s.lines().collect();

            let prefix = old_lines.iter().zip(new_lines.iter())
                .take_while(|(a, b)| a == b).count();
            let suffix = old_lines[prefix..].iter().rev()
                .zip(new_lines[prefix..].iter().rev())
                .take_while(|(a, b)| a == b).count();

            let mut out = format!("`{path}`\n```diff:{ext}\n");
            for &line in &old_lines[..prefix] {
                out.push_str(&format!("  {line}\n"));
            }
            for &line in &old_lines[prefix..old_lines.len() - suffix] {
                out.push_str(&format!("- {line}\n"));
            }
            for &line in &new_lines[prefix..new_lines.len() - suffix] {
                out.push_str(&format!("+ {line}\n"));
            }
            for &line in &old_lines[old_lines.len() - suffix..] {
                out.push_str(&format!("  {line}\n"));
            }
            out.push_str("```");
            out
        }
        "Write" => {
            let path = get_str(v, "file_path");
            let content = get_str(v, "content");
            let ext = std::path::Path::new(path)
                .extension()
                .and_then(|e| e.to_str())
                .unwrap_or("");
            let preview: String = content.lines().take(20).collect::<Vec<_>>().join("\n");
            let truncated = if content.lines().count() > 20 { "\n// ..." } else { "" };
            format!("`{path}`\n```{ext}\n{preview}{truncated}\n```")
        }
        "Bash" => {
            let cmd = get_str(v, "command");
            let desc = get_str(v, "description");
            let mut out = String::new();
            if !desc.is_empty() {
                out.push_str(desc);
                out.push('\n');
            }
            out.push_str(&format!("```bash\n{cmd}\n```"));
            out
        }
        "Glob" => {
            let pattern = get_str(v, "pattern");
            let path = get_str(v, "path");
            if path.is_empty() {
                format!("`{pattern}`")
            } else {
                format!("`{path}` / `{pattern}`")
            }
        }
        "Grep" => {
            let pattern = get_str(v, "pattern");
            let path = get_str(v, "path");
            if path.is_empty() {
                format!("`{pattern}`")
            } else {
                format!("`{pattern}` in `{path}`")
            }
        }
        "Task" | "Agent" => {
            get_str(v, "description").to_string()
        }
        _ => {
            format!("```json\n{}\n```", serde_json::to_string_pretty(v).unwrap_or_default())
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
                    let text = match &msg.content {
                        serde_json::Value::String(s) => s.clone(),
                        serde_json::Value::Array(arr) => {
                            let mut parts = Vec::new();
                            for block in arr {
                                if let Ok(b) =
                                    serde_json::from_value::<ContentBlock>(block.clone())
                                {
                                    if b.block_type == "text" {
                                        if let Some(t) = b.text {
                                            parts.push(t);
                                        }
                                    }
                                }
                            }
                            parts.join("\n")
                        }
                        _ => continue,
                    };
                    if !text.is_empty() {
                        messages.push(ChatMessage {
                            id: uuid,
                            role: "user".to_string(),
                            content: text,
                            tool_name: None,
                            tool_status: None,
                            subagent_type: None,
                            subagent_prompt: None,
                            timestamp,
                        });
                    }
                }
            }
            "assistant" => {
                if let Some(msg) = entry.message {
                    if let serde_json::Value::Array(arr) = &msg.content {
                        let mut text_parts = Vec::new();
                        let mut tool_uses: Vec<(String, String, Option<String>, Option<String>)> = Vec::new();

                        for block in arr {
                            if let Ok(b) =
                                serde_json::from_value::<ContentBlock>(block.clone())
                            {
                                match b.block_type.as_str() {
                                    "text" => {
                                        if let Some(t) = b.text {
                                            if !t.is_empty() {
                                                text_parts.push(t);
                                            }
                                        }
                                    }
                                    "tool_use" => {
                                        let name =
                                            b.name.unwrap_or_else(|| "unknown".to_string());
                                        let content = format_tool_content(&name, &b.input);
                                        let (agent_type, agent_prompt) = if name == "Agent" || name == "Task" {
                                            let at = b.input.as_ref()
                                                .and_then(|v| v.get("subagent_type"))
                                                .and_then(|v| v.as_str())
                                                .map(|s| s.to_string());
                                            let ap = b.input.as_ref()
                                                .and_then(|v| v.get("prompt"))
                                                .and_then(|v| v.as_str())
                                                .map(|s| s.to_string());
                                            (at, ap)
                                        } else {
                                            (None, None)
                                        };
                                        tool_uses.push((name, content, agent_type, agent_prompt));
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
                                subagent_type: None,
                                subagent_prompt: None,
                                timestamp,
                            });
                        }

                        for (i, (name, input_str, agent_type, agent_prompt)) in tool_uses.into_iter().enumerate() {
                            messages.push(ChatMessage {
                                id: format!("{}-tool-{}", uuid, i),
                                role: "tool".to_string(),
                                content: input_str,
                                tool_name: Some(name),
                                tool_status: Some("done".to_string()),
                                subagent_type: agent_type,
                                subagent_prompt: agent_prompt,
                                timestamp,
                            });
                        }
                    }
                }
            }
            _ => {}
        }
    }

    messages
}
