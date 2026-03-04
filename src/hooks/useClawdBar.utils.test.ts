import { describe, it, expect } from "vitest";
import {
  scaled,
  getMoveParams,
  hasCollision,
  freeMinX,
  sessionPriority,
  resolveOverlaps,
  BASE_BAR_H,
  PAD_L,
  type ClawdPos1D,
} from "./useClawdBar.utils";
import type { SessionState } from "@/lib/tauri";
import type { SessionPhase } from "@/lib/phases";

function makeSession(id: string, phase: SessionPhase = "idle"): SessionState {
  return {
    session_id: id,
    cwd: "/tmp",
    project_name: "test",
    phase,
    tool_name: null,
    tool_input: null,
    tool_use_id: null,
    pid: null,
    color_index: 0,
    last_activity: Date.now() / 1000,
  };
}

describe("scaled", () => {
  it("returns base value at default bar height", () => {
    expect(scaled(100, BASE_BAR_H)).toBe(100);
  });

  it("scales proportionally", () => {
    expect(scaled(100, BASE_BAR_H * 2)).toBe(200);
    expect(scaled(100, BASE_BAR_H / 2)).toBe(50);
  });

  it("rounds to nearest integer", () => {
    expect(scaled(10, 50)).toBe(Math.round(10 * (50 / BASE_BAR_H)));
  });
});

describe("getMoveParams", () => {
  it("returns high values for processing/running_tool", () => {
    expect(getMoveParams("processing")).toEqual({ chance: 0.7, range: 30 });
    expect(getMoveParams("running_tool")).toEqual({ chance: 0.7, range: 30 });
  });

  it("returns medium values for compacting", () => {
    expect(getMoveParams("compacting")).toEqual({ chance: 0.3, range: 15 });
  });

  it("returns low values for idle/waiting", () => {
    expect(getMoveParams("idle")).toEqual({ chance: 0.08, range: 10 });
    expect(getMoveParams("waiting_for_input")).toEqual({
      chance: 0.08,
      range: 10,
    });
  });

  it("returns zero for unknown phase", () => {
    expect(getMoveParams("ended")).toEqual({ chance: 0, range: 0 });
  });
});

describe("hasCollision", () => {
  const hitboxW = 110;

  it("detects collision within hitbox width", () => {
    const all: Record<string, ClawdPos1D> = {
      a: { x: 100, facingRight: true },
      b: { x: 150, facingRight: true },
    };
    expect(hasCollision("a", all.a, all, hitboxW)).toBe(true);
  });

  it("returns false when outside hitbox", () => {
    const all: Record<string, ClawdPos1D> = {
      a: { x: 100, facingRight: true },
      b: { x: 211, facingRight: true },
    };
    expect(hasCollision("a", all.a, all, hitboxW)).toBe(false);
  });

  it("ignores self", () => {
    const all: Record<string, ClawdPos1D> = {
      a: { x: 100, facingRight: true },
    };
    expect(hasCollision("a", all.a, all, hitboxW)).toBe(false);
  });
});

describe("freeMinX", () => {
  it("returns PAD_L when no home slots", () => {
    expect(freeMinX(0, 42)).toBe(PAD_L);
  });

  it("accounts for home slots", () => {
    expect(freeMinX(2, 42)).toBe(PAD_L + 2 * 42 + 4);
  });
});

describe("sessionPriority", () => {
  it("returns 0 for running session", () => {
    const s = makeSession("run");
    expect(sessionPriority(s, [], "run")).toBe(0);
  });

  it("returns 1 for home session", () => {
    const s = makeSession("home");
    expect(sessionPriority(s, ["home"], null)).toBe(1);
  });

  it("returns 2 for active phase session", () => {
    const s = makeSession("active", "processing");
    expect(sessionPriority(s, [], null)).toBe(2);
  });

  it("returns 3 for rest/idle session", () => {
    const s = makeSession("idle", "idle");
    expect(sessionPriority(s, [], null)).toBe(3);
  });
});

describe("resolveOverlaps", () => {
  it("returns null for fewer than 2 free crabs", () => {
    const pos: Record<string, ClawdPos1D> = {
      a: { x: 50, facingRight: true },
    };
    expect(resolveOverlaps(pos, [], null, 20, 500, 110)).toBeNull();
  });

  it("returns null when no overlaps", () => {
    const pos: Record<string, ClawdPos1D> = {
      a: { x: 50, facingRight: true },
      b: { x: 300, facingRight: true },
    };
    expect(resolveOverlaps(pos, [], null, 20, 500, 110)).toBeNull();
  });

  it("resolves overlapping free crabs", () => {
    const pos: Record<string, ClawdPos1D> = {
      a: { x: 100, facingRight: true },
      b: { x: 110, facingRight: true },
    };
    const result = resolveOverlaps(pos, [], null, 20, 500, 110);
    if (result === null) throw new Error("expected non-null");
    expect(Math.abs(result.a.x - result.b.x)).toBeGreaterThanOrEqual(110);
  });

  it("excludes home and running crabs from resolution", () => {
    const pos: Record<string, ClawdPos1D> = {
      home: { x: 50, facingRight: true },
      run: { x: 55, facingRight: true },
      a: { x: 100, facingRight: true },
    };
    expect(resolveOverlaps(pos, ["home"], "run", 20, 500, 110)).toBeNull();
  });

  it("clamps positions within bounds", () => {
    const pos: Record<string, ClawdPos1D> = {
      a: { x: 100, facingRight: true },
      b: { x: 105, facingRight: true },
      c: { x: 108, facingRight: true },
    };
    const result = resolveOverlaps(pos, [], null, 0, 300, 110);
    if (result === null) throw new Error("expected non-null");
    for (const p of Object.values(result)) {
      expect(p.x).toBeLessThanOrEqual(300);
      expect(p.x).toBeGreaterThanOrEqual(0);
    }
  });
});
