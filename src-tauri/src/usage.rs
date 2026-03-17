use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ClaudeUsage {
    pub five_hour: Option<UsageWindow>,
    pub seven_day: Option<UsageWindow>,
    pub seven_day_sonnet: Option<UsageWindow>,
    pub seven_day_opus: Option<UsageWindow>,
    pub extra_usage: Option<ExtraUsage>,
    pub subscription_type: Option<String>,
    pub rate_limit_tier: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct UsageWindow {
    pub utilization: Option<f64>,
    pub resets_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ExtraUsage {
    pub is_enabled: Option<bool>,
    pub monthly_limit: Option<f64>,
    pub used_credits: Option<f64>,
    pub utilization: Option<f64>,
    pub currency: Option<String>,
}

#[derive(Debug, Deserialize)]
struct ApiResponse {
    five_hour: Option<ApiWindow>,
    seven_day: Option<ApiWindow>,
    seven_day_sonnet: Option<ApiWindow>,
    seven_day_opus: Option<ApiWindow>,
    extra_usage: Option<ApiExtraUsage>,
}

#[derive(Debug, Deserialize)]
struct ApiWindow {
    utilization: Option<f64>,
    resets_at: Option<String>,
}

#[derive(Debug, Deserialize)]
struct ApiExtraUsage {
    is_enabled: Option<bool>,
    monthly_limit: Option<f64>,
    used_credits: Option<f64>,
    utilization: Option<f64>,
    currency: Option<String>,
}

#[derive(Debug, Deserialize)]
struct CredentialsFile {
    #[serde(rename = "claudeAiOauth")]
    claude_ai_oauth: Option<OAuthBlock>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct OAuthBlock {
    access_token: Option<String>,
    subscription_type: Option<String>,
    rate_limit_tier: Option<String>,
}

fn read_token_from_keychain() -> Result<(String, Option<String>, Option<String>), String> {
    let username = std::env::var("USER").unwrap_or_else(|_| "".to_string());

    let accounts = if username.is_empty() {
        vec![]
    } else {
        vec![username]
    };

    for acct in &accounts {
        let output = std::process::Command::new("security")
            .args([
                "find-generic-password",
                "-s",
                "Claude Code-credentials",
                "-a",
                acct,
                "-w",
            ])
            .output()
            .map_err(|e| format!("Failed to run security command: {}", e))?;

        if output.status.success() {
            let json_str = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if let Ok(creds) = serde_json::from_str::<CredentialsFile>(&json_str) {
                if let Some(oauth) = creds.claude_ai_oauth {
                    if let Some(token) = oauth.access_token {
                        if !token.is_empty() {
                            return Ok((token, oauth.subscription_type, oauth.rate_limit_tier));
                        }
                    }
                }
            }
        }
    }

    if let Some(home) = dirs::home_dir() {
        let path = home.join(".claude").join(".credentials.json");
        if path.exists() {
            let content =
                std::fs::read_to_string(&path).map_err(|e| format!("Read error: {}", e))?;
            if let Ok(creds) = serde_json::from_str::<CredentialsFile>(&content) {
                if let Some(oauth) = creds.claude_ai_oauth {
                    if let Some(token) = oauth.access_token {
                        if !token.is_empty() {
                            return Ok((token, oauth.subscription_type, oauth.rate_limit_tier));
                        }
                    }
                }
            }
        }
    }

    Err("No Claude credentials found".to_string())
}

pub async fn fetch_usage() -> Result<ClaudeUsage, String> {
    let (token, subscription_type, rate_limit_tier) =
        tokio::task::spawn_blocking(read_token_from_keychain)
            .await
            .map_err(|e| format!("Join error: {}", e))??;

    let client = reqwest::Client::new();
    let resp = client
        .get("https://api.anthropic.com/api/oauth/usage")
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "application/json")
        .header("anthropic-beta", "oauth-2025-04-20")
        .timeout(std::time::Duration::from_secs(15))
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    if !resp.status().is_success() {
        return Err(format!("API returned {}", resp.status()));
    }

    let api: ApiResponse = resp
        .json()
        .await
        .map_err(|e| format!("Parse error: {}", e))?;

    let convert_window = |w: Option<ApiWindow>| -> Option<UsageWindow> {
        w.map(|w| UsageWindow {
            utilization: w.utilization,
            resets_at: w.resets_at,
        })
    };

    Ok(ClaudeUsage {
        five_hour: convert_window(api.five_hour),
        seven_day: convert_window(api.seven_day),
        seven_day_sonnet: convert_window(api.seven_day_sonnet),
        seven_day_opus: convert_window(api.seven_day_opus),
        extra_usage: api.extra_usage.map(|e| ExtraUsage {
            is_enabled: e.is_enabled,
            monthly_limit: e.monthly_limit,
            used_credits: e.used_credits,
            utilization: e.utilization,
            currency: e.currency,
        }),
        subscription_type,
        rate_limit_tier,
    })
}
