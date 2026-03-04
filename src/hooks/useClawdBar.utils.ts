import { SessionState } from "@/lib/tauri";
import { ACTIVE_PHASES } from "@/lib/phases";

export const BASE_BAR_H = 48;
export const BASE_CLAWD_W = 80;
export const BASE_HITBOX_W = 110;
export const BASE_HOME_SLOT_W = 42;
export const BASE_PAD_R = 40;
export const PAD_L = 20;

export const CLAWD_BAR_WANDER_MS = 2200;
export const CLAWD_BAR_RUN_MS = 600;
export const FADE_OUT_MS = 1500;
export const HOME_RELEASE_MS = 15000;
export const OVERFLOW_FADE_MS = 800;
export const RESOLVE_MS = 800;

export interface ClawdPos1D {
  x: number;
  facingRight: boolean;
}

export function scaled(base: number, barHeight: number) {
  return Math.round(base * (barHeight / BASE_BAR_H));
}

export function getMoveParams(phase: string): { chance: number; range: number } {
  switch (phase) {
    case "processing":
    case "running_tool":
      return { chance: 0.7, range: 30 };
    case "compacting":
      return { chance: 0.3, range: 15 };
    case "waiting_for_input":
    case "idle":
      return { chance: 0.08, range: 10 };
    default:
      return { chance: 0, range: 0 };
  }
}

export function hasCollision(
  id: string,
  pos: ClawdPos1D,
  all: Record<string, ClawdPos1D>,
  hitboxW: number,
): boolean {
  for (const [otherId, otherPos] of Object.entries(all)) {
    if (otherId === id) continue;
    if (Math.abs(pos.x - otherPos.x) < hitboxW) return true;
  }
  return false;
}

export function freeMinX(homeCount: number, homeSlotW: number) {
  return homeCount > 0 ? PAD_L + homeCount * homeSlotW + 4 : PAD_L;
}

export function sessionPriority(
  s: SessionState,
  homeIds: string[],
  runningId: string | null,
): number {
  if (s.session_id === runningId) return 0;
  if (homeIds.includes(s.session_id)) return 1;
  if (ACTIVE_PHASES.has(s.phase)) return 2;
  return 3;
}

export function resolveOverlaps(
  positions: Record<string, ClawdPos1D>,
  homeIds: string[],
  runningId: string | null,
  minX: number,
  maxX: number,
  hitboxW: number,
): Record<string, ClawdPos1D> | null {
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
