import { MutableRefObject, useEffect } from "react";

import { ACTIVE_PHASES, type SessionPhase } from "@/constants/phases";
import { SessionState } from "@/services/tauri";

import { type ClawdPos1D, PAD_L } from "./useClawdBar.utils";

export function useClawdBarTransitions(
  sessions: SessionState[],
  prevPhasesRef: MutableRefObject<Record<string, string>>,
  homeIdsRef: MutableRefObject<string[]>,
  syncHomeIds: (ids: string[]) => void,
  setRunQueue: React.Dispatch<React.SetStateAction<string[]>>,
  setFadingIds: React.Dispatch<React.SetStateAction<Set<string>>>,
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
    const prev = prevPhasesRef.current;
    const newTransitions: string[] = [];
    const newlyEnded: string[] = [];
    const leavingHome: string[] = [];

    for (const s of sessions) {
      const prevPhase = prev[s.session_id];
      if (s.session_id in prev) {
        if (ACTIVE_PHASES.has(prevPhase as SessionPhase) && !ACTIVE_PHASES.has(s.phase)) {
          newTransitions.push(s.session_id);
        }
        if (prevPhase !== "ended" && s.phase === "ended") {
          newlyEnded.push(s.session_id);
        }
        if (!ACTIVE_PHASES.has(prevPhase as SessionPhase) && ACTIVE_PHASES.has(s.phase)) {
          if (homeIdsRef.current.includes(s.session_id)) {
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
      queueMicrotask(() => setRunQueue((q) => [...q, ...newTransitions]));
    }

    if (newlyEnded.length > 0) {
      const endedSet = new Set(newlyEnded);
      syncHomeIds(homeIdsRef.current.filter((id) => !endedSet.has(id)));

      const el = containerRef.current;
      const w = el ? el.clientWidth : 300;
      setPositions((prev) => {
        const next = { ...prev };
        for (const id of newlyEnded) {
          if (id in next) {
            next[id] = { x: w - PAD_R, facingRight: true };
          }
        }
        return next;
      });

      queueMicrotask(() =>
        setFadingIds((f) => {
          const next = new Set(f);
          for (const id of newlyEnded) next.add(id);
          return next;
        }),
      );
    }

    if (leavingHome.length > 0) {
      const leavingSet = new Set(leavingHome);
      syncHomeIds(homeIdsRef.current.filter((id) => !leavingSet.has(id)));

      setPositions((prev) => {
        const next = { ...prev };
        homeIdsRef.current.forEach((id, i) => {
          next[id] = { x: PAD_L + i * HOME_SLOT_W, facingRight: false };
        });
        const el = containerRef.current;
        const w = el ? el.clientWidth : 300;
        const minX =
          homeIdsRef.current.length > 0
            ? PAD_L + homeIdsRef.current.length * HOME_SLOT_W + 4
            : PAD_L;
        for (const id of leavingHome) {
          next[id] = {
            x: minX + Math.random() * Math.max(0, w - minX - PAD_R - CRAB_W),
            facingRight: Math.random() > 0.5,
          };
        }
        return next;
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions, CRAB_W, HOME_SLOT_W, PAD_R]);
}
