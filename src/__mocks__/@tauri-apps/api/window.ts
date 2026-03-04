import { vi } from "vitest";

export const getCurrentWindow = vi.fn(() => ({
  scaleFactor: vi.fn().mockResolvedValue(1),
  outerPosition: vi.fn().mockResolvedValue({ x: 0, y: 0 }),
  outerSize: vi.fn().mockResolvedValue({ width: 800, height: 600 }),
  setPosition: vi.fn().mockResolvedValue(undefined),
  setSize: vi.fn().mockResolvedValue(undefined),
}));

export const currentMonitor = vi.fn().mockResolvedValue({
  position: { x: 0, y: 0 },
  size: { width: 1920, height: 1080 },
});

export class LogicalSize {
  width: number;
  height: number;
  constructor(w: number, h: number) {
    this.width = w;
    this.height = h;
  }
}

export class PhysicalPosition {
  x: number;
  y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}
