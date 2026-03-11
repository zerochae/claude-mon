import { useState, useEffect, useRef } from "react";
import { SessionState } from "@/services/tauri";
import { ACTIVE_PHASES, type SessionPhase } from "@/constants/phases";
import {
  BASE_CLAWD_W,
  BASE_HITBOX_W,
  BASE_HOME_SLOT_W,
  BASE_PAD_R,
  PAD_L,
  FADE_OUT_MS,
  HOME_RELEASE_MS,
  OVERFLOW_FADE_MS,
  RESOLVE_MS,
  type ClawdPos1D,
  scaled,
  getMoveParams,
  hasCollision,
  freeMinX,
  sessionPriority,
  resolveOverlaps,
} from "./useClawdBar.utils";

export { CLAWD_BAR_WANDER_MS, CLAWD_BAR_RUN_MS } from "./useClawdBar.utils";

let positionCache: Record<string, ClawdPos1D> = {};
let homeIdsCache: string[] = [];

export function useClawdBar(sessions: SessionState[], barHeight: number) {
  const CRAB_W = scaled(BASE_CLAWD_W, barHeight);
  const HITBOX_W = scaled(BASE_HITBOX_W, barHeight);
  const HOME_SLOT_W = scaled(BASE_HOME_SLOT_W, barHeight);
  const PAD_R = scaled(BASE_PAD_R, barHeight);

  const containerRef = useRef<HTMLDivElement>(null);
  const [positions, _setPositions] =
    useState<Record<string, ClawdPos1D>>(positionCache);
  const setPositions: typeof _setPositions = (action) => {
    _setPositions((prev) => {
      const next = typeof action === "function" ? action(prev) : action;
      positionCache = next;
      return next;
    });
  };
  const prevPhasesRef = useRef<Record<string, SessionPhase>>({});
  const [runQueue, setRunQueue] = useState<string[]>([]);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [fadingIds, setFadingIds] = useState<Set<string>>(new Set());
  const fadingIdsRef = useRef(fadingIds);
  useEffect(() => { fadingIdsRef.current = fadingIds; }, [fadingIds]);
  const [spawningIds, setSpawningIds] = useState<Set<string>>(new Set());
  const [overflowIds, setOverflowIds] = useState<Set<string>>(new Set());
  const homeIdsRef = useRef<string[]>(homeIdsCache);
  const [homeCount, setHomeCount] = useState<number>(homeIdsCache.length);

  function syncHomeIds(ids: string[]) {
    homeIdsRef.current = ids;
    homeIdsCache = ids;
    setHomeCount(ids.length);
  }

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const w = el.clientWidth;
    const homeSet = new Set(homeIdsRef.current);
    const minX = freeMinX(homeIdsRef.current.length, HOME_SLOT_W);

    setPositions((prev) => {
      const next = { ...prev };
      let dirty = false;
      const newSpawns: string[] = [];

      for (const s of sessions) {
        if (s.phase === "ended") continue;
        if (!Object.prototype.hasOwnProperty.call(next, s.session_id)) {
          next[s.session_id] = {
            x: minX + Math.random() * Math.max(0, w - minX - PAD_R - CRAB_W),
            facingRight: Math.random() > 0.5,
          };
          newSpawns.push(s.session_id);
          dirty = true;
        }
      }

      if (newSpawns.length > 0) {
        setSpawningIds((prev) => {
          const next = new Set(prev);
          for (const id of newSpawns) next.add(id);
          return next;
        });
      }

      if (dirty) {
        const maxX = w - PAD_R - CRAB_W;
        const resolved = resolveOverlaps(
          next,
          homeIdsRef.current,
          null,
          minX,
          maxX,
          HITBOX_W,
        );
        if (resolved) Object.assign(next, resolved);
      }

      const ids = new Set(sessions.map((s) => s.session_id));
      const disappeared: string[] = [];
      for (const id of Object.keys(next)) {
        if (!ids.has(id) && !fadingIdsRef.current.has(id)) {
          disappeared.push(id);
          if (homeSet.has(id)) {
            syncHomeIds(homeIdsRef.current.filter((h) => h !== id));
          }
        }
      }
      if (disappeared.length > 0) {
        for (const id of disappeared) {
          next[id] = { x: w - PAD_R, facingRight: true };
        }
        queueMicrotask(() =>
          setFadingIds((f) => {
            const n = new Set(f);
            for (const id of disappeared) n.add(id);
            return n;
          }),
        );
        dirty = true;
      }

      return dirty ? next : prev;
    });
  }, [sessions, CRAB_W, HITBOX_W, HOME_SLOT_W, PAD_R]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const CLAWD_BAR_WANDER_MS = 2200;

    const timer = setInterval(() => {
      const w = el.clientWidth;
      const homeSet = new Set(homeIdsRef.current);
      const minX = freeMinX(homeIdsRef.current.length, HOME_SLOT_W);

      setPositions((prev) => {
        const next = { ...prev };
        let dirty = false;

        for (const s of sessions) {
          if (!Object.prototype.hasOwnProperty.call(next, s.session_id))
            continue;
          if (s.session_id === runningId) continue;
          if (homeSet.has(s.session_id)) continue;

          const { chance, range } = getMoveParams(s.phase);
          if (range === 0 || Math.random() > chance) continue;

          const pos = next[s.session_id];
          const dx = (Math.random() - 0.5) * range * 2;
          const nx = Math.max(minX, Math.min(w - CRAB_W - PAD_R, pos.x + dx));
          const candidate: ClawdPos1D = {
            x: nx,
            facingRight: dx !== 0 ? dx > 0 : pos.facingRight,
          };

          if (!hasCollision(s.session_id, candidate, next, HITBOX_W)) {
            next[s.session_id] = candidate;
            dirty = true;
          }
        }

        return dirty ? next : prev;
      });
    }, CLAWD_BAR_WANDER_MS);

    return () => clearInterval(timer);
  }, [sessions, runningId, CRAB_W, HITBOX_W, HOME_SLOT_W, PAD_R]);

  useEffect(() => {
    const prev = prevPhasesRef.current;
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
        const minX = freeMinX(homeIdsRef.current.length, HOME_SLOT_W);
        for (const id of leavingHome) {
          next[id] = {
            x: minX + Math.random() * Math.max(0, w - minX - PAD_R - CRAB_W),
            facingRight: Math.random() > 0.5,
          };
        }
        return next;
      });
    }
  }, [sessions, CRAB_W, HOME_SLOT_W, PAD_R]);

  useEffect(() => {
    if (fadingIds.size === 0) return;

    const timer = setTimeout(() => {
      const fadingSet = fadingIds;
      syncHomeIds(homeIdsRef.current.filter((id) => !fadingSet.has(id)));
      setPositions((prev) => {
        const next = { ...prev };
        for (const id of fadingSet) Reflect.deleteProperty(next, id);
        return next;
      });
      setFadingIds(new Set());
    }, FADE_OUT_MS);

    return () => clearTimeout(timer);
  }, [fadingIds]);

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
  }, [runningId, runQueue, sessions, HOME_SLOT_W]);

  useEffect(() => {
    if (runningId === null) return;
    const CLAWD_BAR_RUN_MS = 600;

    const arrivingId = runningId;
    const timer = setTimeout(() => {
      syncHomeIds([...homeIdsRef.current, arrivingId]);

      const minX = freeMinX(homeIdsRef.current.length, HOME_SLOT_W);
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
  }, [homeCount, runningId, runQueue.length, CRAB_W, PAD_R]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const timer = setInterval(() => {
      const w = el.clientWidth;
      const minX = freeMinX(homeIdsRef.current.length, HOME_SLOT_W);
      const maxX = w - PAD_R - CRAB_W;

      setPositions((prev) => {
        const resolved = resolveOverlaps(
          prev,
          homeIdsRef.current,
          runningId,
          minX,
          maxX,
          HITBOX_W,
        );
        return resolved ?? prev;
      });
    }, RESOLVE_MS);

    return () => clearInterval(timer);
  }, [runningId, CRAB_W, HITBOX_W, HOME_SLOT_W, PAD_R]);

  useEffect(() => {
    if (spawningIds.size === 0) return;
    const timer = setTimeout(() => setSpawningIds(new Set()), 400);
    return () => clearTimeout(timer);
  }, [spawningIds]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const w = el.clientWidth;
    const usable = w - PAD_L - PAD_R;
    const maxVisible = Math.max(1, Math.floor(usable / HITBOX_W));

    if (sessions.length <= maxVisible) {
      if (overflowIds.size > 0) queueMicrotask(() => setOverflowIds(new Set()));
      return;
    }

    const sorted = [...sessions].sort((a, b) => {
      const pa = sessionPriority(a, homeIdsRef.current, runningId);
      const pb = sessionPriority(b, homeIdsRef.current, runningId);
      if (pa !== pb) return pa - pb;
      return b.last_activity - a.last_activity;
    });

    const hidden = new Set(sorted.slice(maxVisible).map((s) => s.session_id));
    queueMicrotask(() => setOverflowIds(hidden));
  }, [sessions, runningId, HITBOX_W, PAD_R, overflowIds.size]);

  useEffect(() => {
    if (overflowIds.size === 0) return;
    const timer = setTimeout(() => {
      setPositions((prev) => {
        const next = { ...prev };
        for (const id of overflowIds) Reflect.deleteProperty(next, id);
        return next;
      });
    }, OVERFLOW_FADE_MS);
    return () => clearTimeout(timer);
  }, [overflowIds]);

  return {
    positions,
    runningId,
    fadingIds,
    spawningIds,
    overflowIds,
    containerRef,
  };
}
