import { memo, useEffect, useRef, useState } from "react";

import { Bubble } from "@/components/Bubble";
import { Clawd } from "@/components/Clawd";
import { InfoChip } from "@/components/InfoChip";
import { PermissionCard } from "@/components/PermissionCard";
import { SleepingZzz } from "@/components/SleepingZzz";
import { COLOR_COUNT, getClawdColor } from "@/constants/colors";
import { formatResetCountdown, useClaudeUsage } from "@/hooks/useClaudeUsage";
import {
  getSessionStats,
  SessionState,
  type SessionStats,
} from "@/services/tauri";
import {
  clawdCenter,
  container,
  detailHeader,
  extraUsageSpread,
  infoCard,
  infoRow,
  infoValue,
  usageBar,
  usageBarSpread,
  usageFill,
  usageLabel,
  usageMuted,
  usageRow,
  usageSection,
  usageText,
} from "@/styles/Detail.styles";
import { isSessionSleeping } from "@/utils/session.utils";

const statsCache = new Map<string, SessionStats>();

interface DetailProps {
  session: SessionState;
  onApprove: (sessionId: string, toolUseId: string) => void;
  onDeny: (sessionId: string, toolUseId: string) => void;
  onContentHeight?: (height: number) => void;
}

function extraUsageFillStyle(utilization: number) {
  return {
    width: `${Math.min(100, utilization)}%`,
    background: "var(--colors-orange)",
  };
}

function shortenHome(path: string): string {
  return path.replace(/^\/(?:Users|home)\/[^/]+/, "~");
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
      <div className={usageBarSpread}>
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
      {resetStr && <span className={usageMuted}>Resets in {resetStr}</span>}
    </div>
  );
}

export const Detail = memo(function Detail({
  session,
  onApprove,
  onDeny,
  onContentHeight,
}: DetailProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const color = getClawdColor(session.color_index);
  const { usage } = useClaudeUsage();

  useEffect(() => {
    if (!onContentHeight) return;
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      onContentHeight(el.offsetHeight);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [onContentHeight]);
  const [stats, setStats] = useState<SessionStats | null>(
    statsCache.get(session.session_id) ?? null,
  );

  useEffect(() => {
    getSessionStats(session.session_id, session.cwd)
      .then((data) => {
        statsCache.set(session.session_id, data);
        setStats(data);
      })
      .catch(() => undefined);
  }, [session.session_id, session.cwd, session.last_activity]);

  const contextPct =
    session.context_remaining_pct !== null
      ? 100 - session.context_remaining_pct
      : stats && stats.context_window > 0
        ? (stats.current_context_tokens / stats.context_window) * 100
        : null;

  return (
    <div ref={containerRef} className={container}>
      <div className={detailHeader}>
        <div className={clawdCenter}>
          <Clawd color={color} phase={session.phase} size={32} />
          {isSessionSleeping(session) ? (
            <SleepingZzz size="sm" />
          ) : (
            <Bubble
              variant="bar"
              phase={session.phase}
              lastActivity={session.last_activity}
            />
          )}
          {session.subagent_count > 0 &&
            Array.from({ length: Math.min(session.subagent_count, 3) }).map(
              (_, i) => {
                const miniPhases = [
                  "processing",
                  "compacting",
                  "idle",
                ] as const;
                return (
                  <Clawd
                    key={i}
                    color={getClawdColor(
                      (session.color_index + i + 3) % COLOR_COUNT,
                    )}
                    phase={miniPhases[i % miniPhases.length]}
                    size={14}
                  />
                );
              },
            )}
        </div>
      </div>

      <div className={infoCard}>
        <div className={infoRow}>
          <InfoChip icon="project" value="Project" size="md" />
          <span className={infoValue}>{session.project_name}</span>
        </div>
        <div className={infoRow}>
          <InfoChip icon="path" value="Path" size="md" />
          <span className={infoValue}>{shortenHome(session.cwd)}</span>
        </div>
        {stats?.model && (
          <div className={infoRow}>
            <InfoChip icon="model" value="Model" size="md" />
            <span className={infoValue}>
              {stats.model.replace("claude-", "")}
            </span>
          </div>
        )}
        {usage?.subscriptionType && (
          <div className={infoRow}>
            <InfoChip icon="plan" value="Plan" size="md" />
            <span className={infoValue}>Claude {usage.subscriptionType}</span>
          </div>
        )}
        {stats && stats.message_count > 0 && (
          <div className={infoRow}>
            <InfoChip icon="messages" value="Messages" size="md" />
            <span className={infoValue}>{stats.message_count}</span>
          </div>
        )}
        {stats && stats.total_input_tokens > 0 && (
          <div className={infoRow}>
            <InfoChip icon="token" value="Tokens" size="md" />
            <span className={infoValue}>
              {formatTokens(stats.total_input_tokens)} in
              {" / "}
              {formatTokens(stats.total_output_tokens)} out
            </span>
          </div>
        )}
        {stats && stats.total_cache_read_tokens > 0 && (
          <div className={infoRow}>
            <InfoChip icon="cache" value="Cache" size="md" />
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
          <UsageBarRow
            label="Context Window"
            pct={contextPct}
            resetIso={null}
          />
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
              <div className={extraUsageSpread}>
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
                    style={extraUsageFillStyle(usage.extraUsage.utilization)}
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
