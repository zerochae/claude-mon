pub fn get_str<'a>(v: &'a serde_json::Value, key: &str) -> &'a str {
    v.get(key).and_then(|v| v.as_str()).unwrap_or("")
}

pub fn format_tool_content(name: &str, input: &Option<serde_json::Value>) -> String {
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
