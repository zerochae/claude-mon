import { memo, useEffect, useState } from "react";
import { SessionState, getSessionStats, type SessionStats } from "@/services/tauri";
import { getClawdColor } from "@/constants/colors";
import { Clawd } from "@/components/Clawd";
import { Bubble } from "@/components/Bubble";
import { PermissionCard } from "@/components/PermissionCard";
import { useClaudeUsage, formatResetCountdown } from "@/hooks/useClaudeUsage";
import {
  container,
  clawdCenter,
  projectInfo,
  projectName,
  projectCwd,
  infoCard,
  infoRow,
  infoLabel,
  infoValue,
  usageSection,
  usageRow,
  usageLabel,
  usageBar,
  usageFill,
  usageText,
  usageMuted,
} from "@/styles/Detail.styles";

interface DetailProps {
  session: SessionState;
  onApprove: (sessionId: string, toolUseId: string) => void;
  onDeny: (sessionId: string, toolUseId: string) => void;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function UsageBarRow({
  label,
  pct,
  resetIso,
}: {
  label: string;
  pct: number;
  resetIso: string | null;
}) {
  const clamped = Math.min(100, Math.max(0, pct));
  const resetStr = formatResetCountdown(resetIso);
  return (
    <div className={usageRow}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span className={usageLabel}>{label}</span>
        <span className={usageText}>{Math.round(clamped)}% used</span>
      </div>
      <div className={usageBar}>
        <div
          className={usageFill}
          style={{
            width: `${clamped}%`,
            background:
              clamped >= 80
                ? "var(--colors-red)"
                : clamped >= 50
                  ? "var(--colors-yellow)"
                  : "var(--colors-green)",
          }}
        />
      </div>
      {resetStr && (
        <span className={usageMuted}>Resets in {resetStr}</span>
      )}
    </div>
  );
}

export const Detail = memo(function Detail({
  session,
  onApprove,
  onDeny,
}: DetailProps) {
  const color = getClawdColor(session.color_index);
  const { usage } = useClaudeUsage();
  const [stats, setStats] = useState<SessionStats | null>(null);

  useEffect(() => {
    getSessionStats(session.session_id, session.cwd)
      .then(setStats)
      .catch(() => undefined);
  }, [session.session_id, session.cwd, session.last_activity]);

  const contextPct =
    stats && stats.context_window > 0
      ? (stats.current_context_tokens / stats.context_window) * 100
      : null;

  return (
    <div className={container}>
      <div className={clawdCenter}>
        <Bubble
          variant="stage"
          phase={session.phase}
          lastActivity={session.last_activity}
        />
        <Clawd color={color} phase={session.phase} size={48} />
      </div>

      <div className={projectInfo}>
        <div className={projectName}>{session.project_name}</div>
        <div className={projectCwd}>{session.cwd}</div>
      </div>

      <div className={infoCard}>
        {stats?.model && (
          <div className={infoRow}>
            <span className={infoLabel}>Model</span>
            <span className={infoValue}>
              {stats.model.replace("claude-", "")}
            </span>
          </div>
        )}
        {usage?.subscriptionType && (
          <div className={infoRow}>
            <span className={infoLabel}>Plan</span>
            <span className={infoValue}>
              Claude {usage.subscriptionType}
            </span>
          </div>
        )}
        {stats && stats.message_count > 0 && (
          <div className={infoRow}>
            <span className={infoLabel}>Messages</span>
            <span className={infoValue}>{stats.message_count}</span>
          </div>
        )}
        {stats && stats.total_input_tokens > 0 && (
          <div className={infoRow}>
            <span className={infoLabel}>Tokens</span>
            <span className={infoValue}>
              {formatTokens(stats.total_input_tokens)} in
              {" / "}
              {formatTokens(stats.total_output_tokens)} out
            </span>
          </div>
        )}
        {stats && stats.total_cache_read_tokens > 0 && (
          <div className={infoRow}>
            <span className={infoLabel}>Cache</span>
            <span className={infoValue}>
              {formatTokens(stats.total_cache_read_tokens)} read
              {stats.total_cache_write_tokens > 0 &&
                ` / ${formatTokens(stats.total_cache_write_tokens)} write`}
            </span>
          </div>
        )}
      </div>

      {contextPct !== null && (
        <div className={usageSection}>
          <UsageBarRow label="Context Window" pct={contextPct} resetIso={null} />
        </div>
      )}

      {usage && (
        <div className={usageSection}>
          {usage.fiveHour?.utilization !== undefined &&
            usage.fiveHour.utilization !== null && (
              <UsageBarRow
                label="Session (5h)"
                pct={usage.fiveHour.utilization}
                resetIso={usage.fiveHour.resetsAt}
              />
            )}
          {usage.sevenDay?.utilization !== undefined &&
            usage.sevenDay.utilization !== null && (
              <UsageBarRow
                label="Weekly (7d)"
                pct={usage.sevenDay.utilization}
                resetIso={usage.sevenDay.resetsAt}
              />
            )}
          {usage.sevenDaySonnet?.utilization !== undefined &&
            usage.sevenDaySonnet.utilization !== null &&
            usage.sevenDaySonnet.utilization > 0 && (
              <UsageBarRow
                label="Sonnet"
                pct={usage.sevenDaySonnet.utilization}
                resetIso={usage.sevenDaySonnet.resetsAt}
              />
            )}
          {usage.sevenDayOpus?.utilization !== undefined &&
            usage.sevenDayOpus.utilization !== null &&
            usage.sevenDayOpus.utilization > 0 && (
              <UsageBarRow
                label="Opus"
                pct={usage.sevenDayOpus.utilization}
                resetIso={usage.sevenDayOpus.resetsAt}
              />
            )}
          {usage.extraUsage?.isEnabled && (
            <div className={usageRow}>
              <div
                style={{ display: "flex", justifyContent: "space-between" }}
              >
                <span className={usageLabel}>Extra Usage</span>
                <span className={usageText}>
                  ${((usage.extraUsage.usedCredits ?? 0) / 100).toFixed(2)}
                  {usage.extraUsage.monthlyLimit !== null &&
                    ` / $${(usage.extraUsage.monthlyLimit / 100).toFixed(2)}`}
                </span>
              </div>
              {usage.extraUsage.utilization !== null && (
                <div className={usageBar}>
                  <div
                    className={usageFill}
                    style={{
                      width: `${Math.min(100, usage.extraUsage.utilization)}%`,
                      background: "var(--colors-orange)",
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {session.phase === "waiting_for_approval" &&
        session.tool_use_id &&
        session.tool_name && (
          <PermissionCard
            toolName={session.tool_name}
            toolInput={session.tool_input}
            projectName={session.project_name}
            cwd={session.cwd}
            colorIndex={session.color_index}
            phase={session.phase}
            onAllow={() => {
              if (session.tool_use_id)
                onApprove(session.session_id, session.tool_use_id);
            }}
            onDeny={() => {
              if (session.tool_use_id)
                onDeny(session.session_id, session.tool_use_id);
            }}
          />
        )}
    </div>
  );
});
