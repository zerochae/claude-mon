import { MutableRefObject, useEffect } from "react";

import { SessionState } from "@/services/tauri";

import {
  CLAWD_BAR_RUN_MS,
  type ClawdPos1D,
  HOME_RELEASE_MS,
  PAD_L,
} from "./useClawdBar.utils";

export function useClawdBarRunning(
  sessions: SessionState[],
  runQueue: string[],
  setRunQueue: React.Dispatch<React.SetStateAction<string[]>>,
  runningId: string | null,
  setRunningId: React.Dispatch<React.SetStateAction<string | null>>,
  homeIdsRef: MutableRefObject<string[]>,
  homeCount: number,
  syncHomeIds: (ids: string[]) => void,
  setPositions: (
    action:
      | Record<string, ClawdPos1D>
      | ((prev: Record<string, ClawdPos1D>) => Record<string, ClawdPos1D>),
  ) => void,
  containerRef: MutableRefObject<HTMLDivElement | null>,
  CRAB_W: number,
  HOME_SLOT_W: number,
  PAD_R: number,
) {
  useEffect(() => {
    if (runningId !== null || runQueue.length === 0) return;

    const sessionIds = new Set(sessions.map((s) => s.session_id));
    const validQueue = runQueue.filter((id) => sessionIds.has(id));

    if (validQueue.length === 0) {
      queueMicrotask(() => setRunQueue([]));
      return;
    }

    const nextId = validQueue[0];
    const targetX = PAD_L + homeIdsRef.current.length * HOME_SLOT_W;
    queueMicrotask(() => {
      setRunQueue(validQueue.slice(1));
      setRunningId(nextId);
      setPositions((prev) => ({
        ...prev,
        [nextId]: { x: targetX, facingRight: false },
      }));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runningId, runQueue, sessions, HOME_SLOT_W]);

  useEffect(() => {
    if (runningId === null) return;

    const arrivingId = runningId;
    const timer = setTimeout(() => {
      syncHomeIds([...homeIdsRef.current, arrivingId]);

      const minX =
        homeIdsRef.current.length > 0
          ? PAD_L + homeIdsRef.current.length * HOME_SLOT_W + 4
          : PAD_L;
      const el = containerRef.current;
      const w = el ? el.clientWidth : 300;
      setPositions((prev) => {
        const next = { ...prev };
        const homeSet = new Set(homeIdsRef.current);
        for (const [id, pos] of Object.entries(next)) {
          if (homeSet.has(id)) continue;
          if (pos.x < minX) {
            next[id] = {
              x: minX + Math.random() * Math.max(0, w - minX - PAD_R - CRAB_W),
              facingRight: pos.facingRight,
            };
          }
        }
        return next;
      });

      setRunningId(null);
    }, CLAWD_BAR_RUN_MS);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runningId, CRAB_W, HOME_SLOT_W, PAD_R]);

  useEffect(() => {
    if (homeCount === 0 || runningId !== null || runQueue.length > 0) return;

    const timer = setTimeout(() => {
      const releasing = [...homeIdsRef.current];
      syncHomeIds([]);

      const el = containerRef.current;
      const w = el ? el.clientWidth : 300;
      setPositions((prev) => {
        const next = { ...prev };
        for (const id of releasing) {
          next[id] = {
            x: PAD_L + Math.random() * Math.max(0, w - PAD_L - PAD_R - CRAB_W),
            facingRight: Math.random() > 0.5,
          };
        }
        return next;
      });
    }, HOME_RELEASE_MS);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeCount, runningId, runQueue.length, CRAB_W, PAD_R]);
}
