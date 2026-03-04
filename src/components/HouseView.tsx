import { useState, useRef } from "react";
import { SessionState } from "@/lib/tauri";
import { getMascotColor } from "@/lib/colors";
import { MascotCanvas } from "@/components/MascotCanvas";
import { StatusBubble } from "@/components/StatusBubble";
import { Button } from "@/components/Button";
import { PHASE_LABELS } from "@/lib/phases";
import { useMascotPositions } from "@/hooks/useMascotPositions";
import { useActivityDismissal } from "@/hooks/useActivityDismissal";
import {
  MASCOT_SIZE,
  WANDER_INTERVAL,
  emptyState,
  outerContainer,
  canvas,
  mascotSlot,
  spriteWrapper,
  mascotLabel,
  bottomPanel,
  statusBar,
  sessionListScroll,
  sessionItem,
  priorityDot,
  sessionContent,
  sessionName,
  sessionPhase,
  actionButtons,
} from "./HouseView.styles";

interface HouseViewProps {
  sessions: SessionState[];
  onSelectSession: (session: SessionState) => void;
}

export function HouseView({ sessions, onSelectSession }: HouseViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const positions = useMascotPositions(sessions, containerRef);
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
          const color = getMascotColor(session.color_index);
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
              className={mascotSlot}
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
              <StatusBubble
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
                <MascotCanvas
                  color={color}
                  phase={session.phase}
                  size={MASCOT_SIZE}
                />
              </div>
              <span className={mascotLabel({ urgent: isUrgent })}>
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
          {[...sessions]
            .sort((a, b) => {
              const priority = (p: string) =>
                p === "waiting_for_approval"
                  ? 0
                  : p === "waiting_for_input"
                    ? 1
                    : p === "processing"
                      ? 2
                      : p === "ended"
                        ? 4
                        : 3;
              return priority(a.phase) - priority(b.phase);
            })
            .map((session) => {
              const color = getMascotColor(session.color_index);
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
