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
      const prevW = activeWidth;
      setSelectedSessionId(session.session_id);
      setView("chat");
      if (!expanded) expand(viewWidth("chat"));
      else animateToView(prevW, viewWidth("chat"));
    },
    [expanded, expand, viewWidth, activeWidth, animateToView],
  );

  const handleBack = useCallback(() => {
    const prevW = activeWidth;
    if (view === "detail") {
      setView("chat");
      if (expanded) animateToView(prevW, viewWidth("chat"));
    } else {
      setView("stage");
      setSelectedSessionId(null);
      if (expanded) animateToView(prevW, viewWidths.stage);
    }
  }, [view, expanded, activeWidth, animateToView, viewWidths.stage, viewWidth]);

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
    handleGearClick,
  };
}
