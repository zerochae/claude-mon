use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("error while running tauri application")]
    AppStartup,

    #[error("Session not found")]
    SessionNotFound,

    #[error("Session is not waiting for input")]
    SessionNotWaitingForInput,

    #[error("No TTY available for this session")]
    NoTtyAvailable,

    #[error("Invalid TTY path: {0}")]
    InvalidTtyPath(String),

    #[error("tmux not found")]
    TmuxNotFound,

    #[error("tmux is not running")]
    TmuxNotRunning,

    #[error("No tmux pane found for TTY {0}")]
    TmuxPaneNotFound(String),

    #[error("tmux not available: {0}")]
    TmuxUnavailable(String),

    #[error("Failed to send text via tmux: {0}")]
    TmuxSendText(String),

    #[error("Failed to send Enter via tmux: {0}")]
    TmuxSendEnter(String),

    #[error("No Claude credentials found")]
    NoCredentials,

    #[error("Unknown window effect: {0}")]
    UnknownEffect(String),

    #[error("API returned {0}")]
    ApiStatus(u16),

    #[error("Failed to run security command: {0}")]
    SecurityCommand(String),

    #[error("Read error: {0}")]
    ReadError(String),

    #[error("Request failed: {0}")]
    RequestFailed(String),

    #[error("Parse error: {0}")]
    ParseError(String),

    #[error("Not on main thread")]
    NotMainThread,

    #[error("Task join error: {0}")]
    JoinError(String),
}

impl From<AppError> for String {
    fn from(err: AppError) -> String {
        err.to_string()
    }
}
