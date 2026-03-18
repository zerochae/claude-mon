import { useEffect, useState } from "react";

import { useClawdBar } from "@/hooks/useClawdBar";
import { SessionState } from "@/services/tauri";
import { activeKey, filterActive } from "@/utils/session.utils";

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
  };
}
