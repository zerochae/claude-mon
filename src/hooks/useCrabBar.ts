import { useState, useEffect, useRef } from "react";
import { SessionState } from "@/lib/tauri";

const BASE_BAR_H = 48;
const BASE_CRAB_W = 80;
const BASE_HITBOX_W = 90;
const BASE_HOME_SLOT_W = 42;
const BASE_PAD_R = 40;
const PAD_L = 20;

function scaled(base: number, barHeight: number) {
  return Math.round(base * (barHeight / BASE_BAR_H));
}

export const CRAB_BAR_WANDER_MS = 2200;
export const CRAB_BAR_RUN_MS = 600;
const FADE_OUT_MS = 1500;
const HOME_RELEASE_MS = 15000;

const ACTIVE_PHASES = new Set(["processing", "running_tool", "compacting"]);

interface CrabPos {
  x: number;
  facingRight: boolean;
}

let positionCache: Record<string, CrabPos> = {};
let homeIdsCache: string[] = [];

function getMoveParams(phase: string): { chance: number; range: number } {
  switch (phase) {
    case "processing":
    case "running_tool":
      return { chance: 0.7, range: 30 };
    case "compacting":
      return { chance: 0.3, range: 15 };
    case "idle":
      return { chance: 0.08, range: 10 };
    default:
      return { chance: 0, range: 0 };
  }
}

function hasCollision(
  id: string,
  pos: CrabPos,
  all: Record<string, CrabPos>,
  hitboxW: number,
): boolean {
  for (const [otherId, otherPos] of Object.entries(all)) {
    if (otherId === id) continue;
    if (Math.abs(pos.x - otherPos.x) < hitboxW) return true;
  }
  return false;
}

function freeMinX(homeCount: number, homeSlotW: number) {
  return homeCount > 0 ? PAD_L + homeCount * homeSlotW + 4 : PAD_L;
}

const RESOLVE_MS = 800;

function resolveOverlaps(
  positions: Record<string, CrabPos>,
  homeIds: string[],
  runningId: string | null,
  minX: number,
  maxX: number,
  hitboxW: number,
): Record<string, CrabPos> | null {
  const homeSet = new Set(homeIds);
  const freeIds = Object.keys(positions).filter(
    (id) => !homeSet.has(id) && id !== runningId,
  );
  if (freeIds.length < 2) return null;

  const next = { ...positions };
  let changed = false;
  let iterations = 0;

  while (iterations < 5) {
    freeIds.sort((a, b) => next[a].x - next[b].x);
    let overlap = false;

    for (let i = 1; i < freeIds.length; i++) {
      if (next[freeIds[i]].x - next[freeIds[i - 1]].x < hitboxW) {
        next[freeIds[i]] = {
          ...next[freeIds[i]],
          x: Math.min(maxX, next[freeIds[i - 1]].x + hitboxW),
        };
        overlap = true;
        changed = true;
      }
    }

    for (let i = freeIds.length - 1; i >= 0; i--) {
      if (next[freeIds[i]].x > maxX) {
        next[freeIds[i]] = { ...next[freeIds[i]], x: maxX };
        changed = true;
      }
      if (i > 0 && next[freeIds[i]].x - next[freeIds[i - 1]].x < hitboxW) {
        next[freeIds[i - 1]] = {
          ...next[freeIds[i - 1]],
          x: Math.max(minX, next[freeIds[i]].x - hitboxW),
        };
        overlap = true;
        changed = true;
      }
    }

    if (!overlap) break;
    iterations++;
  }

  return changed ? next : null;
}

export function useCrabBar(sessions: SessionState[], barHeight: number) {
  const CRAB_W = scaled(BASE_CRAB_W, barHeight);
  const HITBOX_W = scaled(BASE_HITBOX_W, barHeight);
  const HOME_SLOT_W = scaled(BASE_HOME_SLOT_W, barHeight);
  const PAD_R = scaled(BASE_PAD_R, barHeight);

  const containerRef = useRef<HTMLDivElement>(null);
  const [positions, _setPositions] =
    useState<Record<string, CrabPos>>(positionCache);
  const setPositions: typeof _setPositions = (action) => {
    _setPositions((prev) => {
      const next = typeof action === "function" ? action(prev) : action;
      positionCache = next;
      return next;
    });
  };
  const prevPhasesRef = useRef<Record<string, string>>({});
  const [runQueue, setRunQueue] = useState<string[]>([]);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [fadingIds, setFadingIds] = useState<Set<string>>(new Set());
  const [spawningIds, setSpawningIds] = useState<Set<string>>(new Set());
  const homeIdsRef = useRef<string[]>(homeIdsCache);

  function syncHomeIds(ids: string[]) {
    homeIdsRef.current = ids;
    homeIdsCache = ids;
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
      for (const id of Object.keys(next)) {
        if (!ids.has(id)) {
          Reflect.deleteProperty(next, id);
          if (homeSet.has(id)) {
            syncHomeIds(homeIdsRef.current.filter((h) => h !== id));
          }
          dirty = true;
        }
      }

      return dirty ? next : prev;
    });
  }, [sessions]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

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
          const candidate: CrabPos = {
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
    }, CRAB_BAR_WANDER_MS);

    return () => clearInterval(timer);
  }, [sessions, runningId]);

  useEffect(() => {
    const prev = prevPhasesRef.current;
    const newTransitions: string[] = [];
    const newlyEnded: string[] = [];
    const leavingHome: string[] = [];

    for (const s of sessions) {
      const prevPhase = prev[s.session_id];
      if (prevPhase) {
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
      setRunQueue((q) => [...q, ...newTransitions]);
    }

    if (newlyEnded.length > 0) {
      setFadingIds((f) => {
        const next = new Set(f);
        for (const id of newlyEnded) next.add(id);
        return next;
      });
    }

    if (leavingHome.length > 0) {
      const leavingSet = new Set(leavingHome);
      syncHomeIds(homeIdsRef.current.filter((id) => !leavingSet.has(id)));

      setPositions((prev) => {
        const next = { ...prev };
        homeIdsRef.current.forEach((id, i) => {
          if (next[id])
            next[id] = { x: PAD_L + i * HOME_SLOT_W, facingRight: false };
        });
        const el = containerRef.current;
        const w = el ? el.clientWidth : 300;
        const minX = freeMinX(homeIdsRef.current.length, HOME_SLOT_W);
        for (const id of leavingHome) {
          if (next[id]) {
            next[id] = {
              x: minX + Math.random() * Math.max(0, w - minX - PAD_R - CRAB_W),
              facingRight: Math.random() > 0.5,
            };
          }
        }
        return next;
      });
    }
  }, [sessions]);

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
      setRunQueue([]);
      return;
    }

    const nextId = validQueue[0];
    const targetX = PAD_L + homeIdsRef.current.length * HOME_SLOT_W;
    setRunQueue(validQueue.slice(1));
    setRunningId(nextId);

    setPositions((prev) => ({
      ...prev,
      [nextId]: { x: targetX, facingRight: false },
    }));
  }, [runningId, runQueue, sessions]);

  useEffect(() => {
    if (runningId === null) return;

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
    }, CRAB_BAR_RUN_MS);

    return () => clearTimeout(timer);
  }, [runningId]);

  useEffect(() => {
    if (
      homeIdsRef.current.length === 0 ||
      runningId !== null ||
      runQueue.length > 0
    )
      return;

    const timer = setTimeout(() => {
      const releasing = [...homeIdsRef.current];
      syncHomeIds([]);

      const el = containerRef.current;
      const w = el ? el.clientWidth : 300;
      setPositions((prev) => {
        const next = { ...prev };
        for (const id of releasing) {
          if (next[id]) {
            next[id] = {
              x:
                PAD_L + Math.random() * Math.max(0, w - PAD_L - PAD_R - CRAB_W),
              facingRight: Math.random() > 0.5,
            };
          }
        }
        return next;
      });
    }, HOME_RELEASE_MS);

    return () => clearTimeout(timer);
  }, [homeIdsRef.current.length, runningId, runQueue.length]);

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
  }, [runningId]);

  useEffect(() => {
    if (spawningIds.size === 0) return;
    const timer = setTimeout(() => setSpawningIds(new Set()), 400);
    return () => clearTimeout(timer);
  }, [spawningIds]);

  return { positions, runningId, fadingIds, spawningIds, containerRef };
}
