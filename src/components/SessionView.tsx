import { SessionState } from "@/lib/tauri";
import { getClawdColor } from "@/lib/colors";
import { ClawdCanvas } from "@/components/ClawdCanvas";
import { StatusBubble } from "@/components/StatusBubble";
import { PermissionActions } from "@/components/PermissionActions";
import { Button } from "@/components/Button";
import { PHASE_LABELS } from "@/lib/phases";
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
} from "./SessionView.styles";

interface SessionViewProps {
  session: SessionState;
  onBack: () => void;
  onApprove: (sessionId: string, toolUseId: string) => void;
  onDeny: (sessionId: string, toolUseId: string) => void;
}

export function SessionView({
  session,
  onBack,
  onApprove,
  onDeny,
}: SessionViewProps) {
  const color = getClawdColor(session.color_index);
  const phaseLabel = PHASE_LABELS[session.phase];

  return (
    <div className={container}>
      <Button size="sm" onClick={onBack}>
        &#8592; Back
      </Button>

      <div className={clawdCenter}>
        <StatusBubble
          phase={session.phase}
          lastActivity={session.last_activity}
        />
        <ClawdCanvas color={color} phase={session.phase} size={64} />
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
