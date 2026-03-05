import { useState, useCallback } from "react";
import { SessionState } from "@/services/tauri";
import { useSessions } from "@/hooks/useSessions";
import { useSettings } from "@/hooks/useSettings";
import { useWindowExpansion } from "@/hooks/useWindowExpansion";
import { Header } from "@/components/Header";
import { House } from "@/components/House";
import { Detail } from "@/components/Detail";
import { Chat } from "@/components/Chat";
import { Settings } from "@/components/Settings";
import { MOTION } from "@/constants/motion";

type View = "house" | "detail" | "chat" | "settings";

export default function App() {
  const { sessions, approve, deny } = useSessions();
  const { settings, updateSettings, resetColorOverrides } = useSettings();
  const [view, setView] = useState<View>("house");
  const vw = settings.viewWidths;
  const barWidth = vw.bar;
  const barHeight = settings.barHeight;
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );

  const viewWidth = useCallback(
    (v: View) => vw[v === "detail" ? "house" : v],
    [vw],
  );

  const {
    expanded,
    showContent,
    activeWidth,
    expand,
    collapse,
    toggleExpand,
    animateToView,
  } = useWindowExpansion(viewWidth(view), {
    barWidth,
    barHeight,
    anchor: settings.anchor,
    dock: settings.dock,
    dockMargin: settings.dockMargin,
  });

  const selectedSession =
    sessions.find((s) => s.session_id === selectedSessionId) ?? null;

  const handleSelectSession = (session: SessionState) => {
    setSelectedSessionId(session.session_id);
    setView("chat");
    if (!expanded) expand(viewWidth("chat"));
  };

  const handleBack = () => {
    const prevW = activeWidth;
    const nextW = vw.house;
    setView("house");
    setSelectedSessionId(null);
    if (expanded) animateToView(prevW, nextW);
  };

  const handleOpenDetail = () => {
    if (!selectedSession) return;
    const prevW = activeWidth;
    setView("detail");
    if (expanded) animateToView(prevW, viewWidth("detail"));
  };

  const handleGearClick = () => {
    const nextView = view === "settings" ? "house" : "settings";
    const nextW = viewWidth(nextView);
    setView(nextView);
    if (!expanded) {
      expand(nextW);
    } else {
      animateToView(activeWidth, nextW);
    }
  };

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
        showBack={view !== "house"}
        sessions={sessions}
        barHeight={barHeight}
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
          ) : view === "house" || !selectedSession ? (
            <House
              sessions={sessions}
              onSelectSession={handleSelectSession}
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
              onOpenDetail={handleOpenDetail}
            />
          ) : (
            <Detail
              session={selectedSession}
              onBack={handleBack}
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
