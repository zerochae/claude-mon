import { useEffect, useMemo, useCallback, useRef, useState } from "react";
import { useSessions } from "@/hooks/useSessions";
import type { SessionState } from "@/services/tauri";
import { useSettings } from "@/hooks/useSettings";
import { useWindowExpansion } from "@/hooks/useWindowExpansion";
import { useNavigation, type View } from "@/hooks/useNavigation";
import { ExpandedHeader } from "@/components/Header";
import { Bar } from "@/components/Bar";
import { Stage } from "@/components/Stage";
import { Detail } from "@/components/Detail";
import { Chat } from "@/components/Chat";
import { Settings } from "@/components/Settings";
import { PermissionCard } from "@/components/PermissionCard";
import { MOTION } from "@/constants/motion";

export default function App() {
  const { sessions, approve, deny } = useSessions();
  const { settings, updateSettings, resetColorOverrides, loaded } =
    useSettings();
  const vw = settings.viewWidths;

  const permWrapRef = useRef<HTMLDivElement>(null);
  const [permHeight, setPermHeight] = useState(0);
  const chatPermRef = useRef<HTMLDivElement>(null);
  const [chatPermHeight, setChatPermHeight] = useState(0);

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
    barExtraHeight: permHeight + chatPermHeight,
    ready: loaded,
  });

  const {
    view,
    viewWidth,
    selectedSession,
    handleSelectSession,
    handleBack,
    handleOpenDetail,
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
  const chatOtherPermissions =
    expanded && view === "chat" && selectedSession
      ? pendingPermissions.filter(
          (s) => s.session_id !== selectedSession.session_id,
        )
      : [];

  useEffect(() => {
    const el = permWrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setPermHeight(Math.ceil(entry.contentRect.height));
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      setPermHeight(0);
    };
  }, [barPermissions.length]);

  useEffect(() => {
    const el = chatPermRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setChatPermHeight(Math.ceil(entry.contentRect.height));
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      setChatPermHeight(0);
    };
  }, [chatOtherPermissions.length]);

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

  const viewContent: Record<View, () => React.JSX.Element | null> = {
    settings: () => (
      <Settings
        settings={settings}
        onUpdate={updateSettings}
        onResetColors={resetColorOverrides}
      />
    ),
    stage: () => (
      <Stage
        sessions={sessions}
        onSelectSession={handleSelectSession}
        onApprove={handleApprove}
        onDeny={handleDeny}
      />
    ),
    chat: () =>
      selectedSession ? (
        <Chat
          session={selectedSession}
          onApprove={handleApprove}
          onDeny={handleDeny}
          onOpenDetail={handleOpenDetail}
        />
      ) : null,
    detail: () =>
      selectedSession ? (
        <Detail
          session={selectedSession}
          onApprove={handleApprove}
          onDeny={handleDeny}
        />
      ) : null,
  };

  const resolvedView = view === "chat" && !selectedSession ? "stage" : view;

  return (
    <div className="widget-container">
      {expanded ? (
        <ExpandedHeader
          onGearClick={handleGearClick}
          onCollapse={collapse}
          onBack={handleBack}
          settingsActive={view === "settings"}
          showBack={view !== "stage"}
        />
      ) : (
        <Bar
          sessions={sessions}
          barHeight={settings.barHeight}
          onToggle={handleToggle}
          onSelectSession={handleSelectSession}
        />
      )}
      {barPermissions.length > 0 ? (
        <div
          ref={permWrapRef}
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
              projectName={s.project_name}
              cwd={s.cwd}
              colorIndex={s.color_index}
              phase={s.phase}
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
          {viewContent[resolvedView]()}
        </div>
      ) : null}
      {chatOtherPermissions.length > 0 && (
        <div
          ref={chatPermRef}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            padding: "4px 6px",
          }}
        >
          {chatOtherPermissions.map((s) => (
            <PermissionCard
              key={s.session_id}
              toolName={s.tool_name}
              toolInput={s.tool_input}
              projectName={s.project_name}
              cwd={s.cwd}
              colorIndex={s.color_index}
              phase={s.phase}
              onAllow={() => void approve(s.session_id, s.tool_use_id)}
              onDeny={() => void deny(s.session_id, s.tool_use_id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
