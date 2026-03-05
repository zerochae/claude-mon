import { useState, useCallback } from "react";
import { SessionState } from "@/services/tauri";
import { type ViewWidths } from "@/hooks/useSettings";

export type View = "stage" | "detail" | "chat" | "settings";

interface WindowControls {
  expanded: boolean;
  activeWidth: number;
  expand: (w: number) => void;
  animateToView: (from: number, to: number) => void;
}

export function useNavigation(
  sessions: SessionState[],
  viewWidths: ViewWidths,
  window: WindowControls,
) {
  const [view, setView] = useState<View>("stage");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const viewWidth = useCallback(
    (v: View) => viewWidths[v === "detail" ? "stage" : v],
    [viewWidths],
  );

  const selectedSession =
    sessions.find((s) => s.session_id === selectedSessionId) ?? null;

  const handleSelectSession = useCallback(
    (session: SessionState) => {
      setSelectedSessionId(session.session_id);
      setView("chat");
      if (!window.expanded) window.expand(viewWidth("chat"));
    },
    [window.expanded, window.expand, viewWidth],
  );

  const handleBack = useCallback(() => {
    const prevW = window.activeWidth;
    const nextW = viewWidths.stage;
    setView("stage");
    setSelectedSessionId(null);
    if (window.expanded) window.animateToView(prevW, nextW);
  }, [window.expanded, window.activeWidth, window.animateToView, viewWidths.stage]);

  const handleOpenDetail = useCallback(() => {
    if (!selectedSession) return;
    const prevW = window.activeWidth;
    setView("detail");
    if (window.expanded) window.animateToView(prevW, viewWidth("detail"));
  }, [selectedSession, window.expanded, window.activeWidth, window.animateToView, viewWidth]);

  const handleGearClick = useCallback(() => {
    const nextView: View = view === "settings" ? "stage" : "settings";
    const nextW = viewWidth(nextView);
    setView(nextView);
    if (!window.expanded) {
      window.expand(nextW);
    } else {
      window.animateToView(window.activeWidth, nextW);
    }
  }, [view, viewWidth, window.expanded, window.expand, window.animateToView, window.activeWidth]);

  return {
    view,
    viewWidth,
    selectedSession,
    handleSelectSession,
    handleBack,
    handleOpenDetail,
    handleGearClick,
  };
}
