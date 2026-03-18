import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useBubbleLifecycle } from "@/hooks/useBubbleLifecycle";

const ACTIVE = new Set(["processing", "running_tool", "compacting"]);
const DONE = new Set(["idle"]);

describe("useBubbleLifecycle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("is visible during active phase", () => {
    const now = Math.floor(Date.now() / 1000);
    const { result } = renderHook(() =>
      useBubbleLifecycle({
        phase: "processing",
        lastActivity: now,
        donePhasesSet: DONE,
        activePhasesSet: ACTIVE,
      }),
    );

    expect(result.current.visible).toBe(true);
    expect(result.current.fading).toBe(false);
    expect(result.current.isStale).toBe(false);
  });

  it("becomes stale when lastActivity is old", () => {
    const now = Math.floor(Date.now() / 1000);
    const { result } = renderHook(() =>
      useBubbleLifecycle({
        phase: "processing",
        lastActivity: now - 20,
        donePhasesSet: DONE,
        activePhasesSet: ACTIVE,
        staleThresholdSec: 10,
      }),
    );

    expect(result.current.isStale).toBe(true);
    expect(result.current.visible).toBe(false);
  });

  it("disableStale prevents stale detection", () => {
    const now = Math.floor(Date.now() / 1000);
    const { result } = renderHook(() =>
      useBubbleLifecycle({
        phase: "processing",
        lastActivity: now - 20,
        donePhasesSet: DONE,
        activePhasesSet: ACTIVE,
        staleThresholdSec: 10,
        disableStale: true,
      }),
    );

    expect(result.current.isStale).toBe(false);
    expect(result.current.visible).toBe(true);
  });

  it("transitions to visible when active → done", async () => {
    const now = Math.floor(Date.now() / 1000);
    const { result, rerender } = renderHook(
      ({ phase }) =>
        useBubbleLifecycle({
          phase,
          lastActivity: now,
          donePhasesSet: DONE,
          activePhasesSet: ACTIVE,
          doneVisibleSec: 2,
        }),
      { initialProps: { phase: "processing" } },
    );

    expect(result.current.visible).toBe(true);

    rerender({ phase: "idle" });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.visible).toBe(true);
    expect(result.current.fading).toBe(false);
  });

  it("starts fading after doneVisibleSec expires", async () => {
    const now = Math.floor(Date.now() / 1000);
    const { result, rerender } = renderHook(
      ({ phase }) =>
        useBubbleLifecycle({
          phase,
          lastActivity: now,
          donePhasesSet: DONE,
          activePhasesSet: ACTIVE,
          doneVisibleSec: 2,
          fadeOutMs: 100,
        }),
      { initialProps: { phase: "processing" } },
    );

    rerender({ phase: "idle" });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(result.current.fading).toBe(true);
    expect(result.current.visible).toBe(true);
  });

  it("becomes hidden after fadeOutMs", async () => {
    const now = Math.floor(Date.now() / 1000);
    const { result, rerender } = renderHook(
      ({ phase }) =>
        useBubbleLifecycle({
          phase,
          lastActivity: now,
          donePhasesSet: DONE,
          activePhasesSet: ACTIVE,
          doneVisibleSec: 2,
          fadeOutMs: 100,
        }),
      { initialProps: { phase: "processing" } },
    );

    rerender({ phase: "idle" });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });

    expect(result.current.visible).toBe(false);
  });
});
