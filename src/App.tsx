import { useState, useCallback, useRef, useEffect } from "react";
import { SessionState } from "@/lib/tauri";
import { useSessions } from "@/hooks/useSessions";
import { useSettings } from "@/hooks/useSettings";
import { resizeAnchored, animateWindowSize } from "@/lib/windowManager";
import { WidgetHeader } from "@/components/WidgetHeader";
import { HouseView } from "@/components/HouseView";
import { SessionView } from "@/components/SessionView";
import { ChatView } from "@/components/ChatView";
import { SettingsView } from "@/components/SettingsView";
import { MOTION } from "@/lib/motion";

const EXPANDED_HEIGHT = 460;
const ANIM_MS = 250;

type View = "house" | "detail" | "chat" | "settings";

export default function App() {
  const { sessions, approve, deny } = useSessions();
  const { settings, updateSettings, resetColorOverrides } = useSettings();
  const [view, setView] = useState<View>("house");
  const [expanded, setExpanded] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const animatingRef = useRef(false);
  const vw = settings.viewWidths;
  const barWidth = vw.bar;
  const barHeight = settings.barHeight;
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );

  const viewWidth = useCallback((v: View) => vw[v === "detail" ? "house" : v], [vw]);
  const activeWidth = expanded ? viewWidth(view) : barWidth;

  const anchor = settings.anchor;
  const dock = settings.dock;
  const dockMargin = settings.dockMargin;

  useEffect(() => {
    if (animatingRef.current) return;
    resizeAnchored(
      activeWidth,
      expanded ? EXPANDED_HEIGHT : barHeight,
      anchor,
      dock,
      dockMargin,
    ).catch(() => undefined);
  }, [activeWidth, barHeight, expanded, anchor, dock, dockMargin]);

  const expand = useCallback(() => {
    clearTimeout(timerRef.current);
    const targetW = viewWidth(view);
    setExpanded(true);
    animatingRef.current = true;
    void animateWindowSize(
      barWidth,
      targetW,
      barHeight,
      EXPANDED_HEIGHT,
      anchor,
      dock,
      dockMargin,
      ANIM_MS,
      () => {
        animatingRef.current = false;
      },
    );
    timerRef.current = setTimeout(() => setShowContent(true), 30);
  }, [view, viewWidth, barWidth, barHeight, anchor, dock, dockMargin]);

  const collapse = useCallback(() => {
    clearTimeout(timerRef.current);
    setShowContent(false);
    timerRef.current = setTimeout(() => {
      setExpanded(false);
      animatingRef.current = true;
      void animateWindowSize(
        activeWidth,
        barWidth,
        EXPANDED_HEIGHT,
        barHeight,
        anchor,
        dock,
        dockMargin,
        ANIM_MS,
        () => {
          animatingRef.current = false;
        },
      );
    }, ANIM_MS);
  }, [activeWidth, barWidth, barHeight, anchor, dock, dockMargin]);

  const toggleExpand = useCallback(() => {
    if (expanded) collapse();
    else expand();
  }, [expanded, expand, collapse]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && expanded) collapse();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded, collapse]);

  const selectedSession =
    sessions.find((s) => s.session_id === selectedSessionId) ?? null;

  const handleSelectSession = (session: SessionState) => {
    setSelectedSessionId(session.session_id);
    setView("chat");
    if (!expanded) expand();
  };

  const handleBack = () => {
    const prevW = activeWidth;
    const nextW = vw.house;
    setView("house");
    setSelectedSessionId(null);
    if (expanded && prevW !== nextW) {
      animatingRef.current = true;
      void animateWindowSize(
        prevW,
        nextW,
        EXPANDED_HEIGHT,
        EXPANDED_HEIGHT,
        anchor,
        dock,
        dockMargin,
        ANIM_MS,
        () => {
          animatingRef.current = false;
        },
      );
    }
  };

  const handleGearClick = () => {
    const nextView = view === "settings" ? "house" : "settings";
    const prevW = activeWidth;
    const nextW = viewWidth(nextView);
    setView(nextView);
    if (!expanded) {
      clearTimeout(timerRef.current);
      setExpanded(true);
      animatingRef.current = true;
      void animateWindowSize(
        barWidth,
        nextW,
        barHeight,
        EXPANDED_HEIGHT,
        anchor,
        dock,
        dockMargin,
        ANIM_MS,
        () => {
          animatingRef.current = false;
        },
      );
      timerRef.current = setTimeout(() => setShowContent(true), 30);
    } else if (prevW !== nextW) {
      animatingRef.current = true;
      void animateWindowSize(
        prevW,
        nextW,
        EXPANDED_HEIGHT,
        EXPANDED_HEIGHT,
        anchor,
        dock,
        dockMargin,
        ANIM_MS,
        () => {
          animatingRef.current = false;
        },
      );
    }
  };

  return (
    <div className="widget-container">
      <WidgetHeader
        onGearClick={handleGearClick}
        onToggle={toggleExpand}
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
