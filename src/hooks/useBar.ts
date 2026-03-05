import { useState, useEffect } from "react";
import { SessionState } from "@/services/tauri";
import { useClawdBar } from "@/hooks/useClawdBar";
import { filterActive, activeKey } from "@/utils/session.utils";
import { BASE_BAR_HEIGHT } from "@/styles/Bar.styles";

export function useBar(sessions: SessionState[], barHeight: number) {
  const [activeSessions, setActiveSessions] = useState(() =>
    filterActive(sessions),
  );

  useEffect(() => {
    const sync = () => {
      const next = filterActive(sessions);
      setActiveSessions((prev) =>
        activeKey(prev) === activeKey(next) ? prev : next,
      );
    };
    sync();
    const timer = setInterval(sync, 5000);
    return () => clearInterval(timer);
  }, [sessions]);

  const {
    positions,
    runningId,
    fadingIds,
    spawningIds,
    overflowIds,
    containerRef,
  } = useClawdBar(activeSessions, barHeight);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const hasSessions = activeSessions.length > 0;
  const unitScale = barHeight / BASE_BAR_HEIGHT;

  return {
    activeSessions,
    positions,
    runningId,
    fadingIds,
    spawningIds,
    overflowIds,
    containerRef,
    hoveredId,
    setHoveredId,
    hasSessions,
    unitScale,
  };
}
