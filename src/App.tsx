import { useState, useCallback, useRef, useEffect } from "react";
import {
  getCurrentWindow,
  LogicalSize,
  PhysicalPosition,
  currentMonitor,
} from "@tauri-apps/api/window";
import { SessionState } from "@/lib/tauri";
import { useSessions } from "@/hooks/useSessions";
import {
  useSettings,
  type WindowAnchor,
  type DockPosition,
} from "@/hooks/useSettings";
import { WidgetHeader } from "@/components/WidgetHeader";
import { HouseView } from "@/components/HouseView";
import { SessionView } from "@/components/SessionView";
import { ChatView } from "@/components/ChatView";
import { SettingsView, SETTINGS_WIDTH } from "@/components/SettingsView";
import { MOTION } from "@/lib/motion";

const EXPANDED_HEIGHT = 460;
const ANIM_MS = 250;

async function getScreenBounds() {
  const monitor = await currentMonitor();
  if (!monitor) return null;
  return {
    x: monitor.position.x,
    y: monitor.position.y,
    w: monitor.size.width,
    h: monitor.size.height,
  };
}

function clampToScreen(
  x: number,
  y: number,
  w: number,
  h: number,
  screen: { x: number; y: number; w: number; h: number },
) {
  const cx = Math.max(screen.x, Math.min(x, screen.x + screen.w - w));
  const cy = Math.max(screen.y, Math.min(y, screen.y + screen.h - h));
  return { x: cx, y: cy };
}

async function resizeAnchored(
  newWidth: number,
  newHeight: number,
  anchor: WindowAnchor,
  dock: DockPosition,
  dockMargin: number,
) {
  const win = getCurrentWindow();
  const scale = await win.scaleFactor();
  const pos = await win.outerPosition();
  const size = await win.outerSize();
  const screen = await getScreenBounds();
  const newPhysW = Math.round(newWidth * scale);
  const newPhysH = Math.round(newHeight * scale);
  const physMargin = Math.round(dockMargin * scale);

  let nx: number, ny: number;
  if (dock !== "none" && screen) {
    nx = screen.x + Math.round((screen.w - newPhysW) / 2);
    ny =
      dock === "top"
        ? screen.y + physMargin
        : screen.y + screen.h - newPhysH - physMargin;
  } else {
    const dx = Math.round((size.width - newPhysW) / 2);
    let dy = 0;
    if (anchor === "center") dy = Math.round((size.height - newPhysH) / 2);
    else if (anchor === "bottom") dy = size.height - newPhysH;
    nx = pos.x + dx;
    ny = pos.y + dy;
    if (screen) {
      const clamped = clampToScreen(nx, ny, newPhysW, newPhysH, screen);
      nx = clamped.x;
      ny = clamped.y;
    }
  }
  await win.setPosition(new PhysicalPosition(nx, ny));
  await win.setSize(new LogicalSize(newWidth, newHeight));
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

async function animateWindowSize(
  fromW: number,
  toW: number,
  fromH: number,
  toH: number,
  anchor: WindowAnchor,
  dock: DockPosition,
  dockMargin: number,
  duration: number,
  onDone?: () => void,
) {
  const win = getCurrentWindow();
  const scale = await win.scaleFactor();
  const startPos = await win.outerPosition();
  const screen = await getScreenBounds();
  const physFromW = Math.round(fromW * scale);
  const physFromH = Math.round(fromH * scale);
  const physMargin = Math.round(dockMargin * scale);
  const start = performance.now();

  function step(now: number) {
    const t = Math.min(1, (now - start) / duration);
    const e = easeOutCubic(t);
    const w = Math.round(fromW + (toW - fromW) * e);
    const h = Math.round(fromH + (toH - fromH) * e);
    const physW = Math.round(w * scale);
    const physH = Math.round(h * scale);

    let nx: number, ny: number;
    if (dock !== "none" && screen) {
      nx = screen.x + Math.round((screen.w - physW) / 2);
      ny =
        dock === "top"
          ? screen.y + physMargin
          : screen.y + screen.h - physH - physMargin;
    } else {
      const dx = Math.round((physFromW - physW) / 2);
      let dy = 0;
      if (anchor === "center") dy = Math.round((physFromH - physH) / 2);
      else if (anchor === "bottom") dy = physFromH - physH;
      nx = startPos.x + dx;
      ny = startPos.y + dy;
      if (screen) {
        const clamped = clampToScreen(nx, ny, physW, physH, screen);
        nx = clamped.x;
        ny = clamped.y;
      }
    }
    win.setPosition(new PhysicalPosition(nx, ny)).catch(() => {});
    win.setSize(new LogicalSize(w, h)).catch(() => {});
    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      onDone?.();
    }
  }
  requestAnimationFrame(step);
}

type View = "house" | "detail" | "chat" | "settings";

export default function App() {

  const { sessions, approve, deny } = useSessions();
  const { settings, updateSettings, resetColorOverrides } = useSettings();
  const [view, setView] = useState<View>("house");
  const [expanded, setExpanded] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const animatingRef = useRef(false);
  const winWidth = settings.windowWidth;
  const barHeight = settings.barHeight;
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );

  const isSettings = view === "settings" && expanded;
  const activeWidth = isSettings ? SETTINGS_WIDTH : winWidth;

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
    ).catch(() => {});
  }, [activeWidth, barHeight, expanded, anchor, dock, dockMargin]);

  const expand = useCallback(() => {
    clearTimeout(timerRef.current);
    const targetW = view === "settings" ? SETTINGS_WIDTH : winWidth;
    setExpanded(true);
    animatingRef.current = true;
    animateWindowSize(
      winWidth,
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
  }, [view, winWidth, barHeight, anchor, dock, dockMargin]);

  const collapse = useCallback(() => {
    clearTimeout(timerRef.current);
    setShowContent(false);
    timerRef.current = setTimeout(() => {
      setExpanded(false);
      animatingRef.current = true;
      animateWindowSize(
        activeWidth,
        winWidth,
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
  }, [activeWidth, winWidth, barHeight, anchor, dock, dockMargin]);

  const toggleExpand = useCallback(() => {
    if (expanded) collapse();
    else expand();
  }, [expanded, expand, collapse]);

  const selectedSession =
    sessions.find((s) => s.session_id === selectedSessionId) ?? null;

  const handleSelectSession = (session: SessionState) => {
    setSelectedSessionId(session.session_id);
    setView("chat");
    if (!expanded) expand();
  };

  const handleBack = () => {
    const prevW = activeWidth;
    setView("house");
    setSelectedSessionId(null);
    if (expanded && prevW !== winWidth) {
      animatingRef.current = true;
      animateWindowSize(
        prevW,
        winWidth,
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
    const nextW = nextView === "settings" ? SETTINGS_WIDTH : winWidth;
    setView(nextView);
    if (!expanded) {
      clearTimeout(timerRef.current);
      setExpanded(true);
      animatingRef.current = true;
      animateWindowSize(
        prevW,
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
      animateWindowSize(
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
