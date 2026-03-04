import { useState, useCallback } from "react";
import { SessionState } from "@/lib/tauri";
import { useSessions } from "@/hooks/useSessions";
import { useSettings } from "@/hooks/useSettings";
import { useWindowExpansion } from "@/hooks/useWindowExpansion";
import { WidgetHeader } from "@/components/WidgetHeader";
import { HouseView } from "@/components/HouseView";
import { SessionView } from "@/components/SessionView";
import { ChatView } from "@/components/ChatView";
import { SettingsView } from "@/components/SettingsView";
import { MOTION } from "@/lib/motion";

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

  const viewWidth = useCallback((v: View) => vw[v === "detail" ? "house" : v], [vw]);

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
      <WidgetHeader
        onGearClick={handleGearClick}
        onToggle={() => toggleExpand(viewWidth(view))}
        onCollapse={collapse}
        onBack={handleBack}
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
            <SettingsView
              settings={settings}
              onUpdate={updateSettings}
              onResetColors={resetColorOverrides}
            />
          ) : view === "house" || !selectedSession ? (
            <HouseView
              sessions={sessions}
              onSelectSession={handleSelectSession}
            />
          ) : view === "chat" ? (
            <ChatView
              sessionId={selectedSession.session_id}
              cwd={selectedSession.cwd}
              phase={selectedSession.phase}
            />
          ) : (
            <SessionView
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
