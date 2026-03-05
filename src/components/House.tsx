import { useState, useRef } from "react";
import { SessionState } from "@/services/tauri";
import { getClawdColor, COLOR_COUNT } from "@/constants/colors";
import { Clawd } from "@/components/Clawd";
import { Bubble } from "@/components/Bubble";
import { Button } from "@/components/Button";
import { PHASE_LABELS } from "@/constants/phases";
import { sortByPriority } from "@/utils/session.utils";
import { useClawdPositions } from "@/hooks/useClawdPositions";
import { useActivityDismissal } from "@/hooks/useActivityDismissal";
import {
  CLAWD_SIZE,
  MINI_CLAWD_SIZE,
  WANDER_INTERVAL,
  emptyState,
  outerContainer,
  canvas,
  clawdSlot,
  clawdRow,
  spriteWrapper,
  clawdLabel,
  miniClawdRow,
  miniClawdWrap,
  bottomPanel,
  statusBar,
  sessionListScroll,
  sessionItem,
  priorityDot,
  sessionContent,
  sessionName,
  sessionPhase,
  actionButtons,
} from "@/styles/House.styles";

interface HouseProps {
  sessions: SessionState[];
  onSelectSession: (session: SessionState) => void;
}

export function House({ sessions, onSelectSession }: HouseProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const positions = useClawdPositions(sessions, containerRef);
  const { dismissedIds, dismiss } = useActivityDismissal(sessions);

  const activeSessions = sessions.filter((s) => s.phase !== "ended");
  const waitingSessions = sessions.filter(
    (s) =>
      s.phase === "waiting_for_input" || s.phase === "waiting_for_approval",
  );

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
                    variant="house"
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
                {session.subagent_count > 0 && (
                  <div className={miniClawdRow}>
                    {Array.from({ length: Math.min(session.subagent_count, 5) }).map((_, i) => {
                      const miniColor = getClawdColor((session.color_index + i + 3) % COLOR_COUNT);
                      const miniPhases = ["processing", "compacting", "idle"] as const;
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
                )}
              </div>
              <span className={clawdLabel({ urgent: isUrgent })}>
                {session.project_name}
              </span>
            </div>
          );
        })}
      </div>

      <div className={bottomPanel}>
        <div className={statusBar}>
          <span>{activeSessions.length} active</span>
          <span>&middot;</span>
          <span>{waitingSessions.length} waiting</span>
        </div>
        <div className={sessionListScroll}>
          {sortByPriority(sessions)
            .map((session) => {
              const color = getClawdColor(session.color_index);
              const isUrgent = session.phase === "waiting_for_approval";
              const phaseLabel = PHASE_LABELS[session.phase];

              return (
                <div
                  key={session.session_id}
                  onClick={() => onSelectSession(session)}
                  className={sessionItem}
                  onMouseEnter={() => setHoveredId(session.session_id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <div
                    className={priorityDot({ urgent: isUrgent })}
                    style={!isUrgent ? { background: color } : undefined}
                  />
                  <div className={sessionContent}>
                    <div className={sessionName}>{session.project_name}</div>
                    <div className={sessionPhase}>
                      {phaseLabel}
                      {session.tool_name ? ` · ${session.tool_name}` : ""}
                    </div>
                  </div>
                  <div className={actionButtons}>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSession(session);
                      }}
                      title="Detail"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                      >
                        <circle
                          cx="7"
                          cy="7"
                          r="3"
                          stroke="var(--colors-comment, #565c64)"
                          strokeWidth="1.2"
                        />
                        <circle
                          cx="7"
                          cy="7"
                          r="1"
                          fill="var(--colors-comment, #565c64)"
                        />
                      </svg>
                    </Button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
