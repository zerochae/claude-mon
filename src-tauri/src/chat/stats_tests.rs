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
