import {
  CLAWD_SIZE,
  HITBOX_X,
  HITBOX_Y,
  LABEL_HEIGHT,
  PAD_X,
  PAD_Y_BOTTOM,
  PAD_Y_TOP,
  SLOT_W,
} from "@/styles/Stage.styles";

export interface ClawdPos2D {
  x: number;
  y: number;
  facingRight: boolean;
}

export function getMoveParams(phase: string): {
  chance: number;
  range: number;
} {
  switch (phase) {
    case "processing":
      return { chance: 0.75, range: 55 };
    case "compacting":
      return { chance: 0.3, range: 25 };
    case "idle":
      return { chance: 0.08, range: 15 };
    default:
      return { chance: 0, range: 0 };
  }
}

export function overlaps(a: ClawdPos2D, b: ClawdPos2D): boolean {
  return Math.abs(a.x - b.x) < HITBOX_X && Math.abs(a.y - b.y) < HITBOX_Y;
}

export function hasCollision(
  id: string,
  pos: ClawdPos2D,
  all: Record<string, ClawdPos2D>,
): boolean {
  for (const [otherId, otherPos] of Object.entries(all)) {
    if (otherId === id) continue;
    if (overlaps(pos, otherPos)) return true;
  }
  return false;
}

export function resolveOverlaps2D(
  positions: Record<string, ClawdPos2D>,
  w: number,
  h: number,
): Record<string, ClawdPos2D> | null {
  const ids = Object.keys(positions);
  if (ids.length < 2) return null;

  const next = { ...positions };
  let changed = false;
  let iterations = 0;

  while (iterations < 5) {
    let anyOverlap = false;
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = next[ids[i]];
        const b = next[ids[j]];
        if (!overlaps(a, b)) continue;
        anyOverlap = true;
        changed = true;
        const dx = b.x - a.x || (Math.random() - 0.5) * 2;
        const dy = b.y - a.y || (Math.random() - 0.5) * 2;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const pushX = (dx / dist) * HITBOX_X * 0.6;
        const pushY = (dy / dist) * HITBOX_Y * 0.6;
        next[ids[i]] = {
          ...a,
          x: Math.max(PAD_X, Math.min(w - SLOT_W - PAD_X, a.x - pushX)),
          y: Math.max(
            PAD_Y_TOP,
            Math.min(h - CLAWD_SIZE - LABEL_HEIGHT - PAD_Y_BOTTOM, a.y - pushY),
          ),
        };
        next[ids[j]] = {
          ...b,
          x: Math.max(PAD_X, Math.min(w - SLOT_W - PAD_X, b.x + pushX)),
          y: Math.max(
            PAD_Y_TOP,
            Math.min(h - CLAWD_SIZE - LABEL_HEIGHT - PAD_Y_BOTTOM, b.y + pushY),
          ),
        };
      }
    }
    if (!anyOverlap) break;
    iterations++;
  }

  return changed ? next : null;
}
