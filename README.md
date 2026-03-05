# ClaudeMon

A desktop widget that monitors active [Claude Code](https://docs.anthropic.com/en/docs/claude-code) sessions and displays them as animated crab mascots in an always-on-top bar.

Built with [Tauri v2](https://v2.tauri.app/) + React + Rust.

## Features

- **Live Session Tracking** — Each session appears as an animated crab with a unique color
- **Status Bubbles** — Visual indicators for processing, running tools, compacting, waiting, done
- **Permission Handling** — Approve/deny tool-use requests directly from the widget
- **Chat History** — View conversation transcripts with syntax-highlighted code blocks
- **Themeable** — 11 built-in themes with per-color overrides and macOS vibrancy effects
- **Configurable** — Per-view widths, bar height, anchor, dock mode, opacity, border, font size

## How It Works

```
Claude Code ──hook──▶ claude-mon-state.py ──socket──▶ /tmp/claude-mon.sock
                                                              │
                                                        Tauri Backend
                                                     (SessionManager)
                                                              │
                                                        Tauri Events
                                                              │
                                                      React Frontend
                                                    (BarView / HouseView)
```

On launch, ClaudeMon installs a hook script into `~/.claude/hooks/` and registers it in `~/.claude/settings.json`. The hook fires on Claude Code lifecycle events and sends JSON payloads to a Unix socket. The Rust backend processes events and broadcasts updates to the React frontend. Permission requests keep the socket open until the user responds from the widget.

## Getting Started

```bash
pnpm install
pnpm tauri dev       # development
pnpm tauri build     # production (output: src-tauri/target/release/bundle/)
```

Requires macOS, Node.js v18+, Rust stable, Tauri CLI v2, pnpm.

## Window Manager Integration

ClaudeMon is an always-on-top overlay visible on all workspaces. Tiling window managers should ignore it.

### yabai

```bash
# ~/.config/yabai/yabairc
yabai -m rule --add app="^ClaudeMon$" manage=off
```

### SketchyBar

Filter ClaudeMon from space widget window queries:

```bash
yabai -m query --windows --space "$sid" 2>/dev/null \
  | jq -r '[.[] | select(.app | test("ClaudeMon") | not)] | .[].app' \
  | sort -u | grep -v '^$'
```

### Hide from Dock / Cmd+Tab

Toggle **Settings > Hide from Dock** to run as a macOS accessory app.

## Tech Stack

Tauri v2 / React 18 + TypeScript / PandaCSS / Rust + Tokio / Shiki / Unix socket IPC
