import { css } from "@styled-system/css";
import { SessionState } from "@/lib/tauri";
import { getMascotColor } from "@/lib/colors";
import { MascotCanvas } from "@/components/MascotCanvas";
import { StatusBubble } from "@/components/StatusBubble";
import { PermissionActions } from "@/components/PermissionActions";
import { Button } from "@/components/Button";

const PHASE_LABELS: Record<string, string> = {
  idle: "Idle",
  processing: "Processing...",
  waitingForInput: "Waiting for input",
  waitingForApproval: "Waiting for approval",
  compacting: "Compacting context",
  ended: "Session ended",
};

interface SessionViewProps {
  session: SessionState;
  onBack: () => void;
  onApprove: (sessionId: string, toolUseId: string) => void;
  onDeny: (sessionId: string, toolUseId: string) => void;
}

const container = css({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  padding: "12px 16px",
  gap: "12px",
  overflowY: "auto",
  animation: "view-enter 200ms cubic-bezier(0.34, 1.56, 0.64, 1)",
});

const mascotCenter = css({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
});

const projectInfo = css({ textAlign: "center" });

const projectName = css({
  color: "text",
  fontSize: "15px",
  fontWeight: 600,
  mb: "4px",
});

const projectCwd = css({
  color: "comment",
  fontSize: "11px",
  wordBreak: "break-all",
});

const infoCard = css({
  bg: "surfaceHover",
  border: "0.5px solid token(colors.hairline)",
  borderRadius: "8px",
  padding: "10px 12px",
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  shadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
});

const infoRow = css({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
});

const infoLabel = css({
  color: "comment",
  fontSize: "11px",
});

const infoValue = css({
  color: "text",
  fontSize: "12px",
  fontWeight: 500,
});

const toolBadge = css({
  fontSize: "11px",
  fontFamily: "monospace",
  bg: "surfaceOverlay",
  padding: "2px 6px",
  borderRadius: "4px",
});

const pidValue = css({
  color: "gray",
  fontSize: "11px",
  fontFamily: "monospace",
});

const approvalSection = css({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
});

const toolInputBox = css({
  bg: "surfaceOverlay",
  border: "0.5px solid token(colors.hairline)",
  borderRadius: "8px",
  padding: "8px 10px",
  color: "gray",
  fontSize: "11px",
  fontFamily: "monospace",
  wordBreak: "break-all",
  maxH: "80px",
  overflowY: "auto",
});

export function SessionView({
  session,
  onBack,
  onApprove,
  onDeny,
}: SessionViewProps) {
  const color = getMascotColor(session.color_index);
  const phaseLabel = PHASE_LABELS[session.phase] ?? session.phase;

  return (
    <div className={container}>
      <Button size="sm" onClick={onBack}>
        &#8592; Back
      </Button>

      <div className={mascotCenter}>
        <StatusBubble
          phase={session.phase}
          lastActivity={session.last_activity}
        />
        <MascotCanvas color={color} phase={session.phase} size={64} />
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

      {session.phase === "waitingForApproval" && session.tool_use_id && (
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
