import { memo, useMemo } from "react";

import { Button } from "@/components/Button";
import { getClawdColor } from "@/constants/colors";
import { PHASE_LABELS } from "@/constants/phases";
import { SessionState } from "@/services/tauri";
import {
  actionButtons,
  approvalRow,
  bottomPanel,
  priorityDot,
  sessionContent,
  sessionItem,
  sessionListScroll,
  sessionName,
  sessionPhase,
  statusBar,
} from "@/styles/SessionList.styles";
import { sortByPriority } from "@/utils/session.utils";

interface SessionListProps {
  sessions: SessionState[];
  onSelectSession: (session: SessionState) => void;
  onApprove?: (sessionId: string, toolUseId: string) => void;
  onDeny?: (sessionId: string, toolUseId: string) => void;
  onHover?: (sessionId: string | null) => void;
}

export const SessionList = memo(function SessionList({
  sessions,
  onSelectSession,
  onApprove,
  onDeny,
  onHover,
}: SessionListProps) {
  const { activeCount, waitingCount, sortedSessions } = useMemo(() => {
    let active = 0;
    let waiting = 0;
    for (const s of sessions) {
      if (s.phase !== "ended") active++;
      if (s.phase === "waiting_for_input" || s.phase === "waiting_for_approval")
        waiting++;
    }
    return {
      activeCount: active,
      waitingCount: waiting,
      sortedSessions: sortByPriority(sessions),
    };
  }, [sessions]);

  return (
    <div className={bottomPanel}>
      <div className={statusBar}>
        <span>{activeCount} active</span>
        <span>&middot;</span>
        <span>{waitingCount} waiting</span>
      </div>
      <div className={sessionListScroll}>
        {sortedSessions.map((session) => {
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
                {isUrgent &&
                  session.tool_use_id &&
                  (() => {
                    const tid = session.tool_use_id;
                    return (
                      <div className={approvalRow}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeny?.(session.session_id, tid);
                          }}
                        >
                          Deny
                        </Button>
                        <Button
                          variant="solid"
                          size="sm"
                          color="success"
                          onClick={(e) => {
                            e.stopPropagation();
                            onApprove?.(session.session_id, tid);
                          }}
                        >
                          Allow
                        </Button>
                      </div>
                    );
                  })()}
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSession(session);
                  }}
                  title="Detail"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
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
});
