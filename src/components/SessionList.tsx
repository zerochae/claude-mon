import { SessionState } from "@/services/tauri";
import { getClawdColor } from "@/constants/colors";
import { PHASE_LABELS } from "@/constants/phases";
import { sortByPriority } from "@/utils/session.utils";
import { Button } from "@/components/Button";
import {
  bottomPanel,
  statusBar,
  sessionListScroll,
  sessionItem,
  priorityDot,
  sessionContent,
  sessionName,
  sessionPhase,
  actionButtons,
} from "@/styles/SessionList.styles";

interface SessionListProps {
  sessions: SessionState[];
  onSelectSession: (session: SessionState) => void;
  onHover?: (sessionId: string | null) => void;
}

export function SessionList({ sessions, onSelectSession, onHover }: SessionListProps) {
  const activeSessions = sessions.filter((s) => s.phase !== "ended");
  const waitingSessions = sessions.filter(
    (s) =>
      s.phase === "waiting_for_input" || s.phase === "waiting_for_approval",
  );

  return (
    <div className={bottomPanel}>
      <div className={statusBar}>
        <span>{activeSessions.length} active</span>
        <span>&middot;</span>
        <span>{waitingSessions.length} waiting</span>
      </div>
      <div className={sessionListScroll}>
        {sortByPriority(sessions).map((session) => {
          const color = getClawdColor(session.color_index);
          const isUrgent = session.phase === "waiting_for_approval";
          const phaseLabel = PHASE_LABELS[session.phase];

          return (
            <div
              key={session.session_id}
              onClick={() => onSelectSession(session)}
              className={sessionItem}
              onMouseEnter={() => onHover?.(session.session_id)}
              onMouseLeave={() => onHover?.(null)}
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
  );
}
