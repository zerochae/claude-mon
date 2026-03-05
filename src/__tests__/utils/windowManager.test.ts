import { describe, it, expect } from "vitest";
import { easeOutCubic, clampToScreen } from "@/utils/windowManager";

describe("easeOutCubic", () => {
  it("returns 0 at t=0", () => {
    expect(easeOutCubic(0)).toBe(0);
  });

  it("returns 1 at t=1", () => {
    expect(easeOutCubic(1)).toBe(1);
  });

  it("increases monotonically", () => {
    let prev = -1;
    for (let t = 0; t <= 1; t += 0.05) {
      const val = easeOutCubic(t);
      expect(val).toBeGreaterThanOrEqual(prev);
      prev = val;
    }
  });

  it("value at t=0.5 is greater than 0.5 (ease-out curve)", () => {
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
  });
});

describe("clampToScreen", () => {
  const screen = { x: 0, y: 0, w: 1920, h: 1080 };

  it("returns same position when within bounds", () => {
    expect(clampToScreen(100, 100, 200, 200, screen)).toEqual({
      x: 100,
      y: 100,
    });
  });

  it("clamps negative positions", () => {
    expect(clampToScreen(-50, -50, 200, 200, screen)).toEqual({ x: 0, y: 0 });
  });

  it("clamps positions exceeding screen bounds", () => {
    expect(clampToScreen(1800, 950, 200, 200, screen)).toEqual({
      x: 1720,
      y: 880,
    });
  });

  it("handles screen with offset", () => {
    const offsetScreen = { x: 100, y: 50, w: 1920, h: 1080 };
    expect(clampToScreen(50, 20, 200, 200, offsetScreen)).toEqual({
      x: 100,
      y: 50,
    });
  });
});
