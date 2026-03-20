mod constants;

use constants::TMUX_CANDIDATES;

pub fn find_tmux_bin() -> Result<String, String> {
    for path in TMUX_CANDIDATES {
        if std::path::Path::new(path).exists() {
            return Ok(path.to_string());
        }
    }
    Err("tmux not found".to_string())
}

pub fn find_tmux_target(tty_path: &str, pid: Option<u32>) -> Result<String, String> {
    let tmux = find_tmux_bin()?;
    let output = std::process::Command::new(&tmux)
        .args(["list-panes", "-a", "-F", "#{pane_tty} #{session_name}:#{window_index}.#{pane_index}"])
        .output()
        .map_err(|e| format!("tmux not available: {}", e))?;

    if !output.status.success() {
        return Err("tmux is not running".to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let panes: Vec<(&str, &str)> = stdout
        .lines()
        .filter_map(|line| {
            let mut parts = line.splitn(2, ' ');
            Some((parts.next()?, parts.next()?))
        })
        .collect();

    for &(tty, target) in &panes {
        if tty == tty_path {
            return Ok(target.to_string());
        }
    }

    if let Some(pid) = pid {
        let ancestor_ttys = collect_ancestor_ttys(pid);
        for ancestor_tty in &ancestor_ttys {
            for &(tty, target) in &panes {
                if tty == ancestor_tty {
                    return Ok(target.to_string());
                }
            }
        }
    }

    Err(format!("No tmux pane found for TTY {}", tty_path))
}

fn collect_ancestor_ttys(pid: u32) -> Vec<String> {
    let mut ttys = Vec::new();
    let mut current_pid = pid;
    for _ in 0..10 {
        let output = std::process::Command::new("ps")
            .args(["-o", "ppid=,tty=", "-p", &current_pid.to_string()])
            .output();
        let output = match output {
            Ok(o) if o.status.success() => o,
            _ => break,
        };
        let line = String::from_utf8_lossy(&output.stdout).trim().to_string();
        let mut parts = line.split_whitespace();
        let ppid: u32 = match parts.next().and_then(|s| s.parse().ok()) {
            Some(p) if p > 1 => p,
            _ => break,
        };
        if let Some(tty) = parts.next() {
            if tty != "??" && tty != "-" {
                let full_tty = if tty.starts_with("/dev/") {
                    tty.to_string()
                } else {
                    format!("/dev/{}", tty)
                };
                if !ttys.contains(&full_tty) {
                    ttys.push(full_tty);
                }
            }
        }
        current_pid = ppid;
    }
    ttys
}
