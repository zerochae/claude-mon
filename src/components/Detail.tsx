import { memo } from "react";
import { SessionState } from "@/services/tauri";
import { getClawdColor } from "@/constants/colors";
import { Clawd } from "@/components/Clawd";
import { Bubble } from "@/components/Bubble";
import { PermissionActions } from "@/components/PermissionActions";
import { PHASE_LABELS } from "@/constants/phases";
import {
  container,
  clawdCenter,
  projectInfo,
  projectName,
  projectCwd,
  infoCard,
  infoRow,
  infoLabel,
  infoValue,
  toolBadge,
  pidValue,
  approvalSection,
  toolInputBox,
} from "@/styles/Detail.styles";

interface DetailProps {
  session: SessionState;
  onApprove: (sessionId: string, toolUseId: string) => void;
  onDeny: (sessionId: string, toolUseId: string) => void;
}

export const Detail = memo(function Detail({
  session,
  onApprove,
  onDeny,
}: DetailProps) {
  const color = getClawdColor(session.color_index);
  const phaseLabel = PHASE_LABELS[session.phase];

  return (
    <div className={container}>
      <div className={clawdCenter}>
        <Bubble
          variant="stage"
          phase={session.phase}
          lastActivity={session.last_activity}
        />
        <Clawd color={color} phase={session.phase} size={64} />
      </div>

      <div className={projectInfo}>
        <div className={projectName}>{session.project_name}</div>
        <div className={projectCwd}>{session.cwd}</div>
      </div>

      <div className={infoCard}>
        <div className={infoRow}>
          <span className={infoLabel}>Status</span>
          <span className={infoValue}>{phaseLabel}</span>
        </div>
        {session.tool_name && (
          <div className={infoRow}>
            <span className={infoLabel}>Tool</span>
            <span className={toolBadge} style={{ color }}>
              {session.tool_name}
            </span>
          </div>
        )}
        {session.pid && (
          <div className={infoRow}>
            <span className={infoLabel}>PID</span>
            <span className={pidValue}>{session.pid}</span>
          </div>
        )}
      </div>

      {session.phase === "waiting_for_approval" && session.tool_use_id && (
        <div className={approvalSection}>
          {session.tool_input && (
            <div className={toolInputBox}>
              {JSON.stringify(session.tool_input, null, 2)}
            </div>
          )}
          <PermissionActions
            onAllow={() => {
              if (session.tool_use_id)
                onApprove(session.session_id, session.tool_use_id);
            }}
            onDeny={() => {
              if (session.tool_use_id)
                onDeny(session.session_id, session.tool_use_id);
            }}
          />
        </div>
      )}
    </div>
  );
});
