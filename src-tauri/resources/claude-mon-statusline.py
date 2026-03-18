#!/usr/bin/env python3
"""
ClaudeMon Statusline
- Receives status JSON from Claude Code via stdin
- Extracts context_window and cost data
- Sends to ClaudeMon.app via Unix socket
"""
import json
import socket
import sys

SOCKET_PATH = "/tmp/claude-mon.sock"


def main():
    try:
        raw = sys.stdin.read()
        if not raw.strip():
            return
        data = json.loads(raw)
    except (json.JSONDecodeError, ValueError):
        return

    session_id = data.get("session_id", "unknown")
    ctx_win = data.get("context_window", {})
    model = data.get("model", {})
    cost = data.get("cost", {})

    state = {
        "session_id": session_id,
        "event": "StatusLine",
        "status": "statusline",
    }

    if ctx_win:
        state["context_window"] = {
            "remaining_percentage": ctx_win.get("remaining_percentage"),
            "used_tokens": ctx_win.get("used_tokens"),
            "max_tokens": ctx_win.get("max_tokens"),
        }

    if model:
        state["model_id"] = model.get("id")
        state["model_name"] = model.get("display_name")

    if cost:
        state["cost"] = {
            "total_cost_usd": cost.get("total_cost_usd"),
            "input_tokens": cost.get("input_tokens"),
            "output_tokens": cost.get("output_tokens"),
        }

    try:
        sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        sock.settimeout(2)
        sock.connect(SOCKET_PATH)
        sock.sendall(json.dumps(state).encode())
        sock.close()
    except (socket.error, OSError):
        pass


if __name__ == "__main__":
    main()
