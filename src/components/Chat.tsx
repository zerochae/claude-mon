import { memo, useCallback, useEffect, useRef, useState } from "react";

import { Bubble } from "@/components/Bubble";
import { Button } from "@/components/Button";
import { MessageGroup } from "@/components/Chat.MessageGroup";
import { ThinkingIndicator } from "@/components/Chat.ThinkingIndicator";
import { ToolMessage } from "@/components/Chat.ToolMessage";
import { Clawd } from "@/components/Clawd";
import { InfoChip } from "@/components/InfoChip";
import { Loading } from "@/components/Loading";
import { SleepingZzz } from "@/components/SleepingZzz";
import { COLOR_COUNT, getClawdColor } from "@/constants/colors";
import { ui } from "@/constants/glyph";
import { useChat } from "@/hooks/useChat";
import {
  getGitInfo,
  getSessionStats,
  type GitInfo,
  type SessionState,
  type SessionStats,
} from "@/services/tauri";
import {
  chatHeader,
  chatHeaderLabel,
  chatHeaderLeft,
  chatInput,
  chatMiniRow,
  chatMiniWrap,
  chatSleepingWrap,
  dividerDot,
  errorBar,
  gitDiffWrap,
  hasMoreIndicator,
  inputBar,
  loadingWrap,
  outerContainer,
  pendingToolArrow,
  pendingToolIcon,
  pendingToolRow,
  scrollArea,
} from "@/styles/Chat.styles";
import { isSessionSleeping } from "@/utils/session.utils";

interface ChatProps {
  session: SessionState;
  onOpenDetail?: () => void;
}

export const Chat = memo(function Chat({ session, onOpenDetail }: ChatProps) {
  const {
    session_id: sessionId,
    cwd,
    phase,
    color_index: colorIndex,
    project_name: projectName,
    last_activity: lastActivity,
    subagent_count: subagentCount,
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
  const [git, setGit] = useState<GitInfo | null>(null);
  const prevGroupsLenRef = useRef(-1);
  useEffect(() => {
    const len = groups.length;
    if (len === prevGroupsLenRef.current) return;
    prevGroupsLenRef.current = len;
    void getSessionStats(sessionId, cwd).then(setStats);
    void getGitInfo(cwd)
      .then(setGit)
      .catch(() => undefined);
  }, [sessionId, cwd, groups.length]);

  const isWaiting = phase === "waiting_for_approval" && !!toolUseId;
  const [showPendingTool, setShowPendingTool] = useState(false);
  const togglePendingTool = useCallback(
    () => setShowPendingTool((p) => !p),
    [],
  );

  const modelLabel =
    stats?.model
      ?.replace("claude-", "")
      .replace(/^(\w+)-(\d+)-(\d+)(-\d+)?$/, "$1 $2-$3") ?? null;
  const tokenPct = stats
    ? Math.min(
        100,
        Math.round((stats.current_context_tokens / stats.context_window) * 100),
      )
    : null;

  return (
    <div className={outerContainer}>
      <div className={chatHeader}>
        <div className={chatHeaderLeft}>
          <Clawd
            color={getClawdColor(colorIndex)}
            phase={phase}
            lastActivity={lastActivity}
            size={24}
            onClick={onOpenDetail}
          />
          {isSessionSleeping(session) ? (
            <div className={chatSleepingWrap}>
              <SleepingZzz size="sm" />
            </div>
          ) : (
            <Bubble variant="chat" phase={phase} lastActivity={lastActivity} />
          )}
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
        <span className={chatHeaderLabel}>
          {modelLabel && <InfoChip icon="model" value={modelLabel} />}
          {tokenPct !== null && (
            <>
              <span className={dividerDot}> </span>
              <InfoChip
                icon="token"
                value={`${tokenPct}%`}
                color={
                  tokenPct > 80
                    ? "var(--colors-red)"
                    : tokenPct > 50
                      ? "var(--colors-yellow)"
                      : "var(--colors-green)"
                }
                colorText
              />
            </>
          )}
          <span className={dividerDot}> </span>
          <InfoChip icon="project" value={projectName} />
          {git?.branch && (
            <>
              <span className={dividerDot}> </span>
              <InfoChip icon="branch" value={git.branch} />
              {(git.changedFiles > 0 || git.added > 0 || git.removed > 0) && (
                <span className={gitDiffWrap}>
                  {git.added > 0 && (
                    <InfoChip icon="git_add" value={git.added} colorText />
                  )}
                  {git.changedFiles > 0 && (
                    <InfoChip
                      icon="git_change"
                      value={git.changedFiles}
                      colorText
                    />
                  )}
                  {git.removed > 0 && (
                    <InfoChip icon="git_remove" value={git.removed} colorText />
                  )}
                </span>
              )}
            </>
          )}
        </span>
      </div>
      <div ref={scrollRef} className={scrollArea} onScroll={handleScroll}>
        {loading ? (
          <div className={loadingWrap}>
            <Loading />
          </div>
        ) : (
          <>
            {hasMore && (
              <div className={hasMoreIndicator}>↑ scroll for more</div>
            )}
            {groups.map((group, gi) => {
              const isLastGroup = gi === groups.length - 1;
              const filtered =
                isLastGroup && isWaiting
                  ? group.filter((m) => m.role !== "tool")
                  : group;
              if (filtered.length === 0) return null;
              return (
                <MessageGroup
                  key={group[0].id}
                  messages={filtered}
                  sessionColorIndex={colorIndex}
                />
              );
            })}
            {isWaiting && (
              <>
                <div
                  onClick={togglePendingTool}
                  className={pendingToolRow}
                  style={{ opacity: showPendingTool ? 0.6 : 1 }}
                >
                  <span className={pendingToolIcon}>
                    {ui.bubble_waiting_for_approval}
                  </span>
                  Requesting permission…
                  <span className={pendingToolArrow}>
                    {showPendingTool ? "▲" : "▼"}
                  </span>
                </div>
                {showPendingTool &&
                  groups[groups.length - 1]
                    ?.filter((m) => m.role === "tool")
                    .map((m) => <ToolMessage key={m.id} message={m} locked />)}
              </>
            )}
            {isActive && !isWaiting && <ThinkingIndicator />}
          </>
        )}
      </div>

      {error && <div className={errorBar}>{error}</div>}
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
