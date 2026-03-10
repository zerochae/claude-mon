import { memo, useState, useEffect, useRef, useCallback } from "react";
import { Clawd } from "@/components/Clawd";
import { getClawdColor, COLOR_COUNT } from "@/constants/colors";
import { Bubble } from "@/components/Bubble";
import { Button } from "@/components/Button";
import { Loading } from "@/components/Loading";
import { MessageGroup } from "@/components/Chat.MessageGroup";
import { ThinkingIndicator } from "@/components/Chat.ThinkingIndicator";
import { useChat } from "@/hooks/useChat";
import { PermissionCard } from "@/components/PermissionCard";
import {
  getSessionStats,
  type SessionStats,
  type SessionState,
} from "@/services/tauri";
import {
  outerContainer,
  chatHeader,
  chatHeaderLeft,
  chatHeaderLabel,
  chatMiniRow,
  chatMiniWrap,
  scrollArea,
  inputBar,
  chatInput,
} from "@/styles/Chat.styles";

interface ChatProps {
  session: SessionState;
  onApprove?: (sessionId: string, toolUseId: string) => void;
  onDeny?: (sessionId: string, toolUseId: string) => void;
}

export const Chat = memo(function Chat({
  session,
  onApprove,
  onDeny,
}: ChatProps) {
  const {
    session_id: sessionId,
    cwd,
    phase,
    color_index: colorIndex,
    project_name: projectName,
    last_activity: lastActivity,
    subagent_count: subagentCount,
    tool_name: toolName,
    tool_input: toolInput,
    tool_use_id: toolUseId,
  } = session;
  const {
    input,
    setInput,
    error,
    scrollRef,
    loading,
    isActive,
    groups,
    canSend,
    hasInput,
    handleSend,
    hasMore,
    loadMore,
  } = useChat(sessionId, cwd, phase);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (el && el.scrollTop < 40 && hasMore) {
      const prevHeight = el.scrollHeight;
      loadMore();
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight - prevHeight;
      });
    }
  }, [scrollRef, hasMore, loadMore]);

  const [stats, setStats] = useState<SessionStats | null>(null);
  const prevGroupsLenRef = useRef(-1);
  useEffect(() => {
    const len = groups.length;
    if (len === prevGroupsLenRef.current) return;
    prevGroupsLenRef.current = len;
    void getSessionStats(sessionId, cwd).then(setStats);
  }, [sessionId, cwd, groups.length]);

  const modelLabel =
    stats?.model?.replace("claude-", "").replace(/-/g, " ") ?? null;
  const tokenPct = stats
    ? Math.min(
        100,
        Math.round(
          ((stats.total_input_tokens + stats.total_cache_write_tokens) /
            stats.context_window) *
            100,
        ),
      )
    : null;

  return (
    <div className={outerContainer}>
      <div className={chatHeader}>
        <div className={chatHeaderLeft}>
          <Clawd color={getClawdColor(colorIndex)} phase={phase} size={24} />
          <Bubble variant="chat" phase={phase} lastActivity={lastActivity} />
          {subagentCount > 0 ? (
            <div className={chatMiniRow}>
              {Array.from({ length: Math.min(subagentCount, 3) }).map(
                (_, i) => {
                  const miniPhases = [
                    "processing",
                    "compacting",
                    "idle",
                  ] as const;
                  return (
                    <div
                      key={i}
                      className={chatMiniWrap}
                      style={{
                        animationDelay: `${i * 0.2}s`,
                        transform: i % 2 === 0 ? "scaleX(1)" : "scaleX(-1)",
                      }}
                    >
                      <Clawd
                        color={getClawdColor(
                          (colorIndex + i + 3) % COLOR_COUNT,
                        )}
                        phase={miniPhases[i % miniPhases.length]}
                        size={12}
                      />
                    </div>
                  );
                },
              )}
            </div>
          ) : null}
        </div>
        <span className={chatHeaderLabel}>{projectName}</span>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "3px 12px",
          fontSize: "9px",
          color: "var(--colors-textMuted, #848992)",
          borderBottom:
            "0.5px solid var(--colors-hairline, rgba(255,255,255,0.06))",
          flexShrink: 0,
        }}
      >
        {modelLabel && <span style={{ opacity: 0.7 }}>{modelLabel}</span>}
        {tokenPct !== null && (
          <span
            style={{
              color:
                tokenPct > 80
                  ? "var(--colors-red, #E06C75)"
                  : tokenPct > 50
                    ? "var(--colors-yellow, #e5c07b)"
                    : "var(--colors-green, #98c379)",
            }}
          >
            {tokenPct}%
          </span>
        )}
      </div>
      {phase === "waiting_for_approval" && toolUseId && (
        <PermissionCard
          toolName={toolName}
          toolInput={toolInput}
          onAllow={() => onApprove?.(sessionId, toolUseId)}
          onDeny={() => onDeny?.(sessionId, toolUseId)}
        />
      )}
      <div ref={scrollRef} className={scrollArea} onScroll={handleScroll}>
        {loading ? (
          <div style={{ display: "flex", flex: 1, minHeight: "100%" }}>
            <Loading />
          </div>
        ) : (
          <>
            {hasMore && (
              <div
                style={{
                  textAlign: "center",
                  padding: "6px",
                  fontSize: "10px",
                  color: "var(--colors-textMuted, #848992)",
                  opacity: 0.6,
                }}
              >
                ↑ scroll for more
              </div>
            )}
            {groups.map((group) => (
              <MessageGroup
                key={group[0].id}
                messages={group}
                sessionColorIndex={colorIndex}
              />
            ))}
            {isActive && <ThinkingIndicator />}
          </>
        )}
      </div>

      {error && (
        <div
          style={{
            padding: "2px 8px",
            color: "var(--colors-red, #E06C75)",
            fontSize: "11px",
          }}
        >
          {error}
        </div>
      )}
      <div className={inputBar}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={!canSend}
          placeholder={canSend ? "Message..." : "Waiting..."}
          className={chatInput}
        />
        <Button
          variant={hasInput ? "solid" : "ghost"}
          size="icon"
          color="primary"
          shape="default"
          disabled={!hasInput || !canSend}
          onClick={handleSend}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M6 10V2M6 2L2.5 5.5M6 2L9.5 5.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Button>
      </div>
    </div>
  );
});
