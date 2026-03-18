import { memo } from "react";

import { Bubble } from "@/components/Bubble";
import { Clawd } from "@/components/Clawd";
import { SessionList } from "@/components/SessionList";
import { COLOR_COUNT, getClawdColor } from "@/constants/colors";
import { useStage } from "@/hooks/useStage";
import { SessionState } from "@/services/tauri";
import {
  canvas,
  CLAWD_SIZE,
  clawdLabel,
  clawdRow,
  clawdSlot,
  emptyState,
  MINI_CLAWD_SIZE,
  miniClawdRow,
  miniClawdWrap,
  outerContainer,
  spriteWrapper,
  WANDER_INTERVAL,
} from "@/styles/Stage.styles";

interface StageProps {
  sessions: SessionState[];
  onSelectSession: (session: SessionState) => void;
  onApprove?: (sessionId: string, toolUseId: string) => void;
  onDeny?: (sessionId: string, toolUseId: string) => void;
}

export const Stage = memo(function Stage({
  sessions,
  onSelectSession,
  onApprove,
  onDeny,
}: StageProps) {
  const {
    containerRef,
    hoveredId,
    setHoveredId,
    positions,
    dismissedIds,
    dismiss,
  } = useStage(sessions);

  if (sessions.length === 0) {
    return <div className={emptyState}>No sessions running</div>;
  }

  return (
    <div className={outerContainer}>
      <div ref={containerRef} className={canvas}>
        {sessions.map((session) => {
          const color = getClawdColor(session.color_index);
          const pos = positions[session.session_id];
          if (
            !Object.prototype.hasOwnProperty.call(positions, session.session_id)
          )
            return null;
          const isUrgent = session.phase === "waiting_for_approval";
          const isHovered = hoveredId === session.session_id;

          const animVariant =
            session.phase === "waiting_for_approval"
              ? ("approval" as const)
              : session.phase === "waiting_for_input"
                ? ("input" as const)
                : ("none" as const);

          return (
            <div
              key={session.session_id}
              className={clawdSlot}
              onClick={() => {
                dismiss(session.session_id, session.last_activity);
                onSelectSession(session);
              }}
              onMouseEnter={() => setHoveredId(session.session_id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                left: pos.x,
                top: pos.y,
                transition: `left ${WANDER_INTERVAL}ms ease-in-out, top ${WANDER_INTERVAL}ms ease-in-out, transform 0.15s ease, filter 0.15s ease`,
                ...(isHovered
                  ? {
                      transform: "scale(1.25)",
                      filter: `drop-shadow(0 0 6px ${color}66)`,
                      zIndex: 10,
                    }
                  : {}),
              }}
            >
              <div className={clawdRow}>
                <div>
                  <Bubble
                    variant="stage"
                    phase={session.phase}
                    lastActivity={session.last_activity}
                    dismissed={dismissedIds.has(session.session_id)}
                  />
                  <div
                    className={spriteWrapper({
                      facing: pos.facingRight ? "right" : "left",
                      animation: animVariant,
                    })}
                  >
                    <Clawd
                      color={color}
                      phase={session.phase}
                      size={CLAWD_SIZE}
                    />
                  </div>
                </div>
                {session.subagent_count > 0 ? (
                  <div className={miniClawdRow}>
                    {Array.from({
                      length: Math.min(session.subagent_count, 5),
                    }).map((_, i) => {
                      const miniColor = getClawdColor(
                        (session.color_index + i + 3) % COLOR_COUNT,
                      );
                      const miniPhases = [
                        "processing",
                        "compacting",
                        "idle",
                      ] as const;
                      const facingRight = i % 2 === 0;
                      return (
                        <div
                          key={i}
                          className={miniClawdWrap}
                          style={{
                            animationDelay: `${i * 0.2}s`,
                            transform: facingRight ? "scaleX(1)" : "scaleX(-1)",
                          }}
                        >
                          <Clawd
                            color={miniColor}
                            phase={miniPhases[i % miniPhases.length]}
                            size={MINI_CLAWD_SIZE}
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
              <span className={clawdLabel({ urgent: isUrgent })}>
                {session.project_name}
              </span>
            </div>
          );
        })}
      </div>

      <SessionList
        sessions={sessions}
        onSelectSession={onSelectSession}
        onApprove={onApprove}
        onDeny={onDeny}
        onHover={setHoveredId}
      />
    </div>
  );
});
