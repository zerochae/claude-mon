import { describe, expect, it } from "vitest";

import {
  type ClawdPos2D,
  getMoveParams,
  hasCollision,
  overlaps,
  resolveOverlaps2D,
} from "@/utils/Stage.utils";

describe("getMoveParams", () => {
  it("returns high chance and range for processing", () => {
    expect(getMoveParams("processing")).toEqual({ chance: 0.75, range: 55 });
  });

  it("returns medium chance and range for compacting", () => {
    expect(getMoveParams("compacting")).toEqual({ chance: 0.3, range: 25 });
  });

  it("returns low chance and range for idle", () => {
    expect(getMoveParams("idle")).toEqual({ chance: 0.08, range: 15 });
  });

  it("returns zero for unknown phase", () => {
    expect(getMoveParams("ended")).toEqual({ chance: 0, range: 0 });
    expect(getMoveParams("whatever")).toEqual({ chance: 0, range: 0 });
  });
});

describe("overlaps", () => {
  const base: ClawdPos2D = { x: 100, y: 100, facingRight: true };

  it("returns true when positions are within hitbox", () => {
    expect(overlaps(base, { x: 110, y: 110, facingRight: true })).toBe(true);
  });

  it("returns false when x distance exceeds HITBOX_X (40)", () => {
    expect(overlaps(base, { x: 141, y: 100, facingRight: true })).toBe(false);
  });

  it("returns false when y distance exceeds HITBOX_Y (88)", () => {
    expect(overlaps(base, { x: 100, y: 189, facingRight: true })).toBe(false);
  });

  it("returns true at exact boundary minus 1", () => {
    expect(overlaps(base, { x: 139, y: 187, facingRight: true })).toBe(true);
  });

  it("returns false at exact HITBOX distance", () => {
    expect(overlaps(base, { x: 140, y: 100, facingRight: true })).toBe(false);
    expect(overlaps(base, { x: 100, y: 188, facingRight: true })).toBe(false);
  });
});

describe("hasCollision", () => {
  it("detects collision with another mascot", () => {
    const all: Record<string, ClawdPos2D> = {
      a: { x: 100, y: 100, facingRight: true },
      b: { x: 110, y: 110, facingRight: true },
    };
    expect(hasCollision("a", all.a, all)).toBe(true);
  });

  it("ignores self", () => {
    const all: Record<string, ClawdPos2D> = {
      a: { x: 100, y: 100, facingRight: true },
    };
    expect(hasCollision("a", all.a, all)).toBe(false);
  });

  it("returns false with no collision", () => {
    const all: Record<string, ClawdPos2D> = {
      a: { x: 100, y: 100, facingRight: true },
      b: { x: 300, y: 300, facingRight: true },
    };
    expect(hasCollision("a", all.a, all)).toBe(false);
  });
});

describe("resolveOverlaps2D", () => {
  it("returns null for empty input", () => {
    expect(resolveOverlaps2D({}, 500, 500)).toBeNull();
  });

  it("returns null for single mascot", () => {
    const pos = { a: { x: 100, y: 100, facingRight: true } };
    expect(resolveOverlaps2D(pos, 500, 500)).toBeNull();
  });

  it("returns null when no overlaps exist", () => {
    const pos: Record<string, ClawdPos2D> = {
      a: { x: 10, y: 36, facingRight: true },
      b: { x: 200, y: 200, facingRight: true },
    };
    expect(resolveOverlaps2D(pos, 500, 500)).toBeNull();
  });

  it("resolves overlapping positions", () => {
    const pos: Record<string, ClawdPos2D> = {
      a: { x: 100, y: 100, facingRight: true },
      b: { x: 105, y: 105, facingRight: true },
    };
    const result = resolveOverlaps2D(pos, 500, 500);
    if (result === null) throw new Error("expected non-null");
    const dx = Math.abs(result.a.x - result.b.x);
    const dy = Math.abs(result.a.y - result.b.y);
    expect(dx >= 40 || dy >= 74).toBe(true);
  });

  it("clamps positions within bounds", () => {
    const pos: Record<string, ClawdPos2D> = {
      a: { x: 10, y: 36, facingRight: true },
      b: { x: 15, y: 40, facingRight: true },
    };
    const result = resolveOverlaps2D(pos, 200, 200);
    if (result === null) throw new Error("expected non-null");
    for (const p of Object.values(result)) {
      expect(p.x).toBeGreaterThanOrEqual(10);
      expect(p.y).toBeGreaterThanOrEqual(36);
    }
  });
});
