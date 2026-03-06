import { useSessions } from "@/hooks/useSessions";
import { useSettings } from "@/hooks/useSettings";
import { useWindowExpansion } from "@/hooks/useWindowExpansion";
import { useNavigation } from "@/hooks/useNavigation";
import { Header } from "@/components/Header";
import { Stage } from "@/components/Stage";
import { Detail } from "@/components/Detail";
import { Chat } from "@/components/Chat";
import { Settings } from "@/components/Settings";
import { MOTION } from "@/constants/motion";

export default function App() {
  const { sessions, approve, deny } = useSessions();
  const { settings, updateSettings, resetColorOverrides } = useSettings();
  const vw = settings.viewWidths;

  const {
    expanded,
    showContent,
    activeWidth,
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

  return (
    <div className="widget-container">
      <Header
        onGearClick={handleGearClick}
        onToggle={() => toggleExpand(viewWidth(view))}
        onCollapse={collapse}
        onBack={handleBack}
        onSelectSession={handleSelectSession}
        expanded={expanded}
        settingsActive={view === "settings"}
        showBack={view !== "stage"}
        sessions={sessions}
        barHeight={settings.barHeight}
      />
      {expanded && (
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
              onApprove={(sid, tid) => void approve(sid, tid)}
              onDeny={(sid, tid) => void deny(sid, tid)}
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
              onApprove={(sid, tid) => void approve(sid, tid)}
              onDeny={(sid, tid) => void deny(sid, tid)}
            />
          ) : (
            <Detail
              session={selectedSession}
              onApprove={(sessionId, toolUseId) => {
                void approve(sessionId, toolUseId);
              }}
              onDeny={(sessionId, toolUseId) => {
                void deny(sessionId, toolUseId);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
