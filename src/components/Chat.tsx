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
  getGitInfo,
  type SessionStats,
  type SessionState,
  type GitInfo,
} from "@/services/tauri";
import { ui } from "@/constants/glyph";
import { Glyph } from "@/components/Glyph";
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
  onOpenDetail?: () => void;
}

export const Chat = memo(function Chat({
  session,
  onApprove,
  onDeny,
  onOpenDetail,
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
  const [git, setGit] = useState<GitInfo | null>(null);
  const prevGroupsLenRef = useRef(-1);
  useEffect(() => {
    const len = groups.length;
    if (len === prevGroupsLenRef.current) return;
    prevGroupsLenRef.current = len;
    void getSessionStats(sessionId, cwd).then(setStats);
    void getGitInfo(cwd).then(setGit).catch(() => undefined);
  }, [sessionId, cwd, groups.length]);

  const isWaiting = phase === "waiting_for_approval" && !!toolUseId;
  const [showPerm, setShowPerm] = useState(false);
  useEffect(() => {
    if (!isWaiting) {
      const id = requestAnimationFrame(() => setShowPerm(false));
      return () => cancelAnimationFrame(id);
    }
    const t = setTimeout(() => setShowPerm(true), 300);
    return () => clearTimeout(t);
  }, [isWaiting]);

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
            size={24}
            onClick={onOpenDetail}
          />
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
        <span className={chatHeaderLabel}>
          {modelLabel && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>
              <Glyph size={16} color="var(--colors-blue)">{ui.agent}</Glyph>
              {modelLabel}
            </span>
          )}
          {tokenPct !== null && (
            <>
              <span style={{ opacity: 0.3, margin: "0 3px" }}> </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "2px", color: tokenPct > 80 ? "var(--colors-red)" : tokenPct > 50 ? "var(--colors-yellow)" : "var(--colors-green)" }}>
                <Glyph size={16} color={tokenPct > 80 ? "var(--colors-red)" : tokenPct > 50 ? "var(--colors-yellow)" : "var(--colors-green)"}>{ui.token}</Glyph>
                {tokenPct}%
              </span>
            </>
          )}
          <span style={{ opacity: 0.3, margin: "0 3px" }}> </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>
            <Glyph size={16} color="var(--colors-red)">{ui.folder_close}</Glyph>
            {projectName}
          </span>
          {git?.branch && (
            <>
              <span style={{ opacity: 0.3, margin: "0 3px" }}> </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>
                <Glyph size={13} color="var(--colors-magenta)">{ui.gitBranch}</Glyph>
                {git.branch}
              </span>
              {(git.changedFiles > 0 || git.added > 0 || git.removed > 0) && (
                <span style={{ marginLeft: "4px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  {git.added > 0 && (
                    <span style={{ color: "var(--colors-green)", display: "inline-flex", alignItems: "center", gap: "2px" }}>
                      <Glyph size={12} color="var(--colors-green)">{ui.git_add}</Glyph>{git.added}
                    </span>
                  )}
                  {git.changedFiles > 0 && (
                    <span style={{ color: "var(--colors-orange)", display: "inline-flex", alignItems: "center", gap: "2px" }}>
                      <Glyph size={12} color="var(--colors-orange)">{ui.git_change}</Glyph>{git.changedFiles}
                    </span>
                  )}
                  {git.removed > 0 && (
                    <span style={{ color: "var(--colors-red)", display: "inline-flex", alignItems: "center", gap: "2px" }}>
                      <Glyph size={12} color="var(--colors-red)">{ui.git_remove}</Glyph>{git.removed}
                    </span>
                  )}
                </span>
              )}
            </>
          )}
        </span>
      </div>
      {showPerm && toolUseId && (
        <PermissionCard
          toolName={toolName}
          toolInput={toolInput}
          projectName={projectName}
          cwd={cwd}
          colorIndex={colorIndex}
          phase={phase}
          hideIdentity
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
