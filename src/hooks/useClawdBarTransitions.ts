import type { RefObject } from "react";
import { useEffect } from "react";

import { ACTIVE_PHASES } from "@/constants/phases";
import { SessionState } from "@/services/tauri";

import { type ClawdBarCtx, freeMinX, PAD_L } from "./useClawdBar.utils";

export function useClawdBarTransitions(
  sessions: SessionState[],
  ctxRef: RefObject<ClawdBarCtx>,
  CRAB_W: number,
  HOME_SLOT_W: number,
  PAD_R: number,
) {
  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const prev = ctx.prevPhasesRef.current;
    const newTransitions: string[] = [];
    const newlyEnded: string[] = [];
    const leavingHome: string[] = [];

    for (const s of sessions) {
      const prevPhase = prev[s.session_id];
      if (s.session_id in prev) {
        if (ACTIVE_PHASES.has(prevPhase) && !ACTIVE_PHASES.has(s.phase)) {
          newTransitions.push(s.session_id);
        }
        if (prevPhase !== "ended" && s.phase === "ended") {
          newlyEnded.push(s.session_id);
        }
        if (!ACTIVE_PHASES.has(prevPhase) && ACTIVE_PHASES.has(s.phase)) {
          if (ctx.homeIdsRef.current.includes(s.session_id)) {
            leavingHome.push(s.session_id);
          }
        }
      }
      prev[s.session_id] = s.phase;
    }

    const ids = new Set(sessions.map((s) => s.session_id));
    for (const id of Object.keys(prev)) {
      if (!ids.has(id)) Reflect.deleteProperty(prev, id);
    }

    if (newTransitions.length > 0) {
      queueMicrotask(() =>
        ctx.setRunQueue((q) => [...q, ...newTransitions]),
      );
    }

    if (newlyEnded.length > 0) {
      const endedSet = new Set(newlyEnded);
      ctx.syncHomeIds(ctx.homeIdsRef.current.filter((id) => !endedSet.has(id)));

      const el = ctx.containerRef.current;
      const w = el ? el.clientWidth : 300;
      ctx.setPositions((prev) => {
        const next = { ...prev };
        for (const id of newlyEnded) {
          if (id in next) {
            next[id] = { x: w - PAD_R, facingRight: true };
          }
        }
        return next;
      });

      queueMicrotask(() =>
        ctx.setFadingIds((f) => {
          const next = new Set(f);
          for (const id of newlyEnded) next.add(id);
          return next;
        }),
      );
    }

    if (leavingHome.length > 0) {
      const leavingSet = new Set(leavingHome);
      ctx.syncHomeIds(
        ctx.homeIdsRef.current.filter((id) => !leavingSet.has(id)),
      );

      ctx.setPositions((prev) => {
        const next = { ...prev };
        ctx.homeIdsRef.current.forEach((id, i) => {
          next[id] = { x: PAD_L + i * HOME_SLOT_W, facingRight: false };
        });
        const el = ctx.containerRef.current;
        const w = el ? el.clientWidth : 300;
        const minX = freeMinX(ctx.homeIdsRef.current.length, HOME_SLOT_W);
        for (const id of leavingHome) {
          next[id] = {
            x: minX + Math.random() * Math.max(0, w - minX - PAD_R - CRAB_W),
            facingRight: Math.random() > 0.5,
          };
        }
        return next;
      });
    }
  }, [sessions, ctxRef, CRAB_W, HOME_SLOT_W, PAD_R]);
}
