import type { RefObject } from "react";
import { useEffect } from "react";

import { SessionState } from "@/services/tauri";

import {
  CLAWD_BAR_RUN_MS,
  type ClawdBarCtx,
  freeMinX,
  HOME_RELEASE_MS,
  PAD_L,
} from "./useClawdBar.utils";

export function useClawdBarRunning(
  sessions: SessionState[],
  runQueue: string[],
  runningId: string | null,
  homeCount: number,
  ctxRef: RefObject<ClawdBarCtx>,
  CRAB_W: number,
  HOME_SLOT_W: number,
  PAD_R: number,
) {
  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    if (runningId !== null || runQueue.length === 0) return;

    const sessionIds = new Set(sessions.map((s) => s.session_id));
    const validQueue = runQueue.filter((id) => sessionIds.has(id));

    if (validQueue.length === 0) {
      queueMicrotask(() => ctx.setRunQueue([]));
      return;
    }

    const nextId = validQueue[0];
    const targetX = PAD_L + ctx.homeIdsRef.current.length * HOME_SLOT_W;
    queueMicrotask(() => {
      ctx.setRunQueue(validQueue.slice(1));
      ctx.setRunningId(nextId);
      ctx.setPositions((prev) => ({
        ...prev,
        [nextId]: { x: targetX, facingRight: false },
      }));
    });
  }, [runningId, runQueue, sessions, ctxRef, HOME_SLOT_W]);

  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    if (runningId === null) return;

    const arrivingId = runningId;
    const timer = setTimeout(() => {
      ctx.syncHomeIds([...ctx.homeIdsRef.current, arrivingId]);

      const minX = freeMinX(ctx.homeIdsRef.current.length, HOME_SLOT_W);
      const el = ctx.containerRef.current;
      const w = el ? el.clientWidth : 300;
      ctx.setPositions((prev) => {
        const next = { ...prev };
        const homeSet = new Set(ctx.homeIdsRef.current);
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

      ctx.setRunningId(null);
    }, CLAWD_BAR_RUN_MS);

    return () => clearTimeout(timer);
  }, [runningId, ctxRef, CRAB_W, HOME_SLOT_W, PAD_R]);

  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    if (homeCount === 0 || runningId !== null || runQueue.length > 0) return;

    const timer = setTimeout(() => {
      const releasing = [...ctx.homeIdsRef.current];
      ctx.syncHomeIds([]);

      const el = ctx.containerRef.current;
      const w = el ? el.clientWidth : 300;
      ctx.setPositions((prev) => {
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
  }, [homeCount, runningId, runQueue.length, ctxRef, CRAB_W, PAD_R]);
}
