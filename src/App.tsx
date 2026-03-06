import { useEffect, useMemo, useCallback } from "react";
import { useSessions } from "@/hooks/useSessions";
import type { SessionState } from "@/services/tauri";
import { useSettings } from "@/hooks/useSettings";
import { useWindowExpansion } from "@/hooks/useWindowExpansion";
import { useNavigation } from "@/hooks/useNavigation";
import { Header } from "@/components/Header";
import { Stage } from "@/components/Stage";
import { Detail } from "@/components/Detail";
import { Chat } from "@/components/Chat";
import { Settings } from "@/components/Settings";
import { PermissionCard } from "@/components/PermissionCard";
import { MOTION } from "@/constants/motion";

export default function App() {
  const { sessions, approve, deny } = useSessions();
  const { settings, updateSettings, resetColorOverrides } = useSettings();
  const vw = settings.viewWidths;

  const pendingPermissions = useMemo(
    () =>
      sessions.filter(
        (s): s is SessionState & { tool_use_id: string; tool_name: string } =>
          !!s.tool_use_id &&
          s.phase === "waiting_for_approval" &&
          !!s.tool_name &&
          s.tool_name !== "unknown",
      ),
    [sessions],
  );

  const {
    expanded,
    showContent,
    activeWidth,
    setActiveWidth,
    expand,
    collapse,
    toggleExpand,
    animateToView,
  } = useWindowExpansion(vw.stage, {
    barWidth: vw.bar,
    barHeight: settings.barHeight,
    anchor: settings.anchor,
    dock: settings.dock,
    dockMargin: settings.dockMargin,
    barExtraHeight:
      pendingPermissions.length > 0 ? pendingPermissions.length * 150 : 0,
  });

  const {
    view,
    viewWidth,
    selectedSession,
    handleSelectSession,
    handleBack,
    handleGearClick,
  } = useNavigation(sessions, vw, {
    expanded,
    activeWidth,
    expand,
    animateToView,
  });

  const currentViewWidth = viewWidth(view);
  useEffect(() => {
    if (expanded) setActiveWidth(currentViewWidth);
  }, [expanded, currentViewWidth, setActiveWidth]);

  const barPermissions = !expanded ? pendingPermissions : [];

  const handleToggle = useCallback(
    () => toggleExpand(viewWidth(view)),
    [toggleExpand, viewWidth, view],
  );
  const handleApprove = useCallback(
    (sid: string, tid: string) => void approve(sid, tid),
    [approve],
  );
  const handleDeny = useCallback(
    (sid: string, tid: string) => void deny(sid, tid),
    [deny],
  );

  return (
    <div className="widget-container">
      <Header
        onGearClick={handleGearClick}
        onToggle={handleToggle}
        onCollapse={collapse}
        onBack={handleBack}
        onSelectSession={handleSelectSession}
        expanded={expanded}
        settingsActive={view === "settings"}
        showBack={view !== "stage"}
        sessions={sessions}
        barHeight={settings.barHeight}
      />
      {barPermissions.length > 0 ? (
        <div
          style={{
            padding: "4px 6px 6px",
            background: "var(--colors-bg)",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          {barPermissions.map((s) => (
            <PermissionCard
              key={s.session_id}
              toolName={s.tool_name}
              toolInput={s.tool_input}
              onAllow={() => void approve(s.session_id, s.tool_use_id)}
              onDeny={() => void deny(s.session_id, s.tool_use_id)}
            />
          ))}
        </div>
      ) : null}
      {expanded ? (
        <div
          style={{
            flex: 1,
            opacity: showContent ? 1 : 0,
            transform: showContent ? "translateY(0)" : "translateY(8px)",
            transition: `opacity ${MOTION.duration.normal} ${MOTION.easing.default}, transform ${MOTION.duration.normal} ${MOTION.easing.spring}`,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {view === "settings" ? (
            <Settings
              settings={settings}
              onUpdate={updateSettings}
              onResetColors={resetColorOverrides}
            />
          ) : view === "stage" || !selectedSession ? (
            <Stage
              sessions={sessions}
              onSelectSession={handleSelectSession}
              onApprove={handleApprove}
              onDeny={handleDeny}
            />
          ) : view === "chat" ? (
            <Chat
              sessionId={selectedSession.session_id}
              cwd={selectedSession.cwd}
              phase={selectedSession.phase}
              colorIndex={selectedSession.color_index}
              projectName={selectedSession.project_name}
              lastActivity={selectedSession.last_activity}
              subagentCount={selectedSession.subagent_count}
              toolName={selectedSession.tool_name}
              toolInput={selectedSession.tool_input}
              toolUseId={selectedSession.tool_use_id}
              onApprove={handleApprove}
              onDeny={handleDeny}
            />
          ) : (
            <Detail
              session={selectedSession}
              onApprove={handleApprove}
              onDeny={handleDeny}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}
