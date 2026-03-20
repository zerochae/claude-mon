import { useEffect, useState } from "react";

import { useClawdBar } from "@/hooks/useClawdBar";
import { SessionState } from "@/services/tauri";
import {
  activeKey,
  filterActive,
  isSessionSleeping,
} from "@/utils/session.utils";

export function useBar(sessions: SessionState[], barHeight: number) {
  const [activeSessions, setActiveSessions] = useState(() =>
    filterActive(sessions),
  );
  const [lastColorIndex, setLastColorIndex] = useState(0);

  useEffect(() => {
    const sync = () => {
      const next = filterActive(sessions);
      setActiveSessions((prev) =>
        activeKey(prev) === activeKey(next) ? prev : next,
      );
      if (next.length > 0) {
        setLastColorIndex(next[next.length - 1].color_index);
      }
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
  const sleepingSessions = sessions.filter((s) => isSessionSleeping(s));

  return {
    activeSessions,
    sleepingSessions,
    positions,
    runningId,
    fadingIds,
    spawningIds,
    overflowIds,
    containerRef,
    hoveredId,
    setHoveredId,
    hasSessions,
    lastColorIndex,
  };
}
