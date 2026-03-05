import { SessionState } from "@/services/tauri";
import { getClawdColor } from "@/constants/colors";
import { Clawd } from "@/components/Clawd";
import { Bubble } from "@/components/Bubble";
import { PermissionActions } from "@/components/PermissionActions";
import { Button } from "@/components/Button";
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
} from "./Detail.styles";

interface DetailProps {
  session: SessionState;
  onBack: () => void;
  onApprove: (sessionId: string, toolUseId: string) => void;
  onDeny: (sessionId: string, toolUseId: string) => void;
}

export function Detail({
  session,
  onBack,
  onApprove,
  onDeny,
}: DetailProps) {
  const color = getClawdColor(session.color_index);
  const phaseLabel = PHASE_LABELS[session.phase];

  return (
    <div className={container}>
      <Button size="sm" onClick={onBack}>
        &#8592; Back
      </Button>

      <div className={clawdCenter}>
        <Bubble
          variant="house"
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
            <div className={toolInputBox}>{session.tool_input}</div>
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
}
