import { Clawd } from "@/components/Clawd";
import { getClawdColor, COLOR_COUNT } from "@/constants/colors";
import { Bubble } from "@/components/Bubble";
import { Button } from "@/components/Button";
import { Loading } from "@/components/Loading";
import { MessageGroup } from "@/components/Chat.MessageGroup";
import { ThinkingIndicator } from "@/components/Chat.ThinkingIndicator";
import { useChat } from "@/hooks/useChat";
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
  sessionId: string;
  cwd: string;
  phase: string;
  colorIndex: number;
  projectName: string;
  lastActivity: number;
  subagentCount: number;
  onOpenDetail?: () => void;
}

export function Chat({ sessionId, cwd, phase, colorIndex, projectName, lastActivity, subagentCount, onOpenDetail }: ChatProps) {
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
  } = useChat(sessionId, cwd, phase);

  return (
    <div className={outerContainer}>
      <div className={chatHeader}>
        <div className={chatHeaderLeft}>
          <div onClick={onOpenDetail} style={{ cursor: onOpenDetail ? "pointer" : undefined }}>
            <Clawd color={getClawdColor(colorIndex)} phase={phase} size={24} />
          </div>
          <Bubble variant="chat" phase={phase} lastActivity={lastActivity} />
          {subagentCount > 0 && (
            <div className={chatMiniRow}>
              {Array.from({ length: Math.min(subagentCount, 3) }).map((_, i) => {
                const miniPhases = ["processing", "compacting", "idle"] as const;
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
                      color={getClawdColor((colorIndex + i + 3) % COLOR_COUNT)}
                      phase={miniPhases[i % miniPhases.length]}
                      size={12}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <span className={chatHeaderLabel}>{projectName}</span>
      </div>
      <div ref={scrollRef} className={scrollArea}>
        {loading ? (
          <div style={{ display: "flex", flex: 1, minHeight: "100%" }}>
            <Loading />
          </div>
        ) : (
          <>
            {groups.map((group) => (
              <MessageGroup key={group[0].id} messages={group} sessionColorIndex={colorIndex} />
            ))}
            {isActive && <ThinkingIndicator />}
          </>
        )}
      </div>

      {error && (
        <div style={{ padding: "2px 8px", color: "var(--colors-red, #E06C75)", fontSize: "11px" }}>
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
}
