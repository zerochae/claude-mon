pub const NUM_COLORS: usize = 20;

pub const PHASE_PROCESSING: &str = "processing";
pub const PHASE_RUNNING_TOOL: &str = "running_tool";
pub const PHASE_WAITING_FOR_APPROVAL: &str = "waiting_for_approval";
pub const PHASE_WAITING_FOR_INPUT: &str = "waiting_for_input";
pub const PHASE_COMPACTING: &str = "compacting";
pub const PHASE_ENDED: &str = "ended";
pub const PHASE_NOTIFICATION: &str = "notification";
pub const PHASE_IDLE: &str = "idle";

pub const EVENT_SUBAGENT_STARTED: &str = "subagent_started";
pub const EVENT_SUBAGENT_STOPPED: &str = "subagent_stopped";
pub const EVENT_STATUSLINE: &str = "statusline";

pub const SOCKET_PATH: &str = "/tmp/claude-mon.sock";

pub const HOOK_SCRIPT_NAME: &str = "claude-mon-state.py";
pub const HOOK_IDENTIFIER: &str = "claude-mon-state.py";
pub const STATUSLINE_SCRIPT_NAME: &str = "claude-mon-statusline.py";
pub const STATUSLINE_IDENTIFIER: &str = "claude-mon-statusline.py";

pub const TMUX_CANDIDATES: &[&str] = &[
    "/opt/homebrew/bin/tmux",
    "/usr/local/bin/tmux",
    "/usr/bin/tmux",
    "/bin/tmux",
];

pub const USAGE_API_URL: &str = "https://api.anthropic.com/api/oauth/usage";
pub const ANTHROPIC_BETA_HEADER: &str = "oauth-2025-04-20";
