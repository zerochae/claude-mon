import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useActivityDismissal } from "@/hooks/useActivityDismissal";
import type { SessionState } from "@/services/tauri";
import type { SessionPhase } from "@/constants/phases";

function makeSession(
  id: string,
  lastActivity: number,
  phase: SessionPhase = "processing",
): SessionState {
  return {
    session_id: id,
    cwd: "/tmp",
    project_name: "test",
    phase,
    tool_name: null,
    tool_input: null,
    tool_use_id: null,
    pid: null,
    tty: null,
    subagent_count: 0,
    color_index: 0,
    last_activity: lastActivity,
  };
}

describe("useActivityDismissal", () => {
  it("starts with empty dismissedIds", () => {
    const { result } = renderHook(() => useActivityDismissal([]));
    expect(result.current.dismissedIds.size).toBe(0);
  });

  it("adds session to dismissedIds after dismiss", () => {
    const sessions = [makeSession("s1", 100)];
    const { result } = renderHook(() => useActivityDismissal(sessions));

    act(() => {
      result.current.dismiss("s1", 100);
    });

    expect(result.current.dismissedIds.has("s1")).toBe(true);
  });

  it("removes from dismissedIds when last_activity changes", () => {
    const initialSessions = [makeSession("s1", 100)];
    const { result, rerender } = renderHook(
      ({ sessions }) => useActivityDismissal(sessions),
      { initialProps: { sessions: initialSessions } },
    );

    act(() => {
      result.current.dismiss("s1", 100);
    });
    expect(result.current.dismissedIds.has("s1")).toBe(true);

    rerender({ sessions: [makeSession("s1", 200)] });
    expect(result.current.dismissedIds.has("s1")).toBe(false);
  });

  it("handles multiple sessions", () => {
    const sessions = [makeSession("s1", 100), makeSession("s2", 200)];
    const { result } = renderHook(() => useActivityDismissal(sessions));

    act(() => {
      result.current.dismiss("s1", 100);
      result.current.dismiss("s2", 200);
    });

    expect(result.current.dismissedIds.has("s1")).toBe(true);
    expect(result.current.dismissedIds.has("s2")).toBe(true);
  });
});
