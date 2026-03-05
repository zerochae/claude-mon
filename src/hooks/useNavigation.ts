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
  win: WindowControls,
) {
  const [view, setView] = useState<View>("stage");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );
  const { expanded, activeWidth, expand, animateToView } = win;

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
      if (!expanded) expand(viewWidth("chat"));
    },
    [expanded, expand, viewWidth],
  );

  const handleBack = useCallback(() => {
    const prevW = activeWidth;
    const nextW = viewWidths.stage;
    setView("stage");
    setSelectedSessionId(null);
    if (expanded) animateToView(prevW, nextW);
  }, [expanded, activeWidth, animateToView, viewWidths.stage]);

  const handleOpenDetail = useCallback(() => {
    if (!selectedSession) return;
    const prevW = activeWidth;
    setView("detail");
    if (expanded) animateToView(prevW, viewWidth("detail"));
  }, [selectedSession, expanded, activeWidth, animateToView, viewWidth]);

  const handleGearClick = useCallback(() => {
    const nextView: View = view === "settings" ? "stage" : "settings";
    const nextW = viewWidth(nextView);
    setView(nextView);
    if (!expanded) {
      expand(nextW);
    } else {
      animateToView(activeWidth, nextW);
    }
  }, [view, viewWidth, expanded, expand, animateToView, activeWidth]);

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
