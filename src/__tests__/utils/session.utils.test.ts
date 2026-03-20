import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BAR_STALE_SEC } from "@/constants/phases";
import type { SessionState } from "@/services/tauri";
import { activeKey, filterActive, isSessionSleeping } from "@/utils/session.utils";

function makeSession(
  id: string,
  phase: SessionState["phase"],
  lastActivity?: number,
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
    last_activity: lastActivity ?? Math.floor(Date.now() / 1000),
    context_remaining_pct: null,
    context_used_tokens: null,
    context_max_tokens: null,
  };
}

const NOW_SEC = 1_000_000;

beforeEach(() => {
  vi.spyOn(Date, "now").mockReturnValue(NOW_SEC * 1000);
  vi.spyOn(window, "getComputedStyle").mockReturnValue({
    getPropertyValue: () => "",
  } as unknown as CSSStyleDeclaration);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("filterActive", () => {
  it("includes active phase sessions", () => {
    const sessions = [
      makeSession("a", "processing"),
      makeSession("b", "running_tool"),
      makeSession("c", "compacting"),
    ];
    expect(filterActive(sessions)).toHaveLength(3);
  });

  it("includes waiting_for_approval regardless of last activity", () => {
    const stale = makeSession("a", "waiting_for_approval", NOW_SEC - BAR_STALE_SEC - 100);
    expect(filterActive([stale])).toHaveLength(1);
  });

  it("includes waiting_for_input when activity is recent", () => {
    const recent = makeSession("a", "waiting_for_input", NOW_SEC - 10);
    expect(filterActive([recent])).toHaveLength(1);
  });

  it("excludes waiting_for_input when activity is stale", () => {
    const stale = makeSession("a", "waiting_for_input", NOW_SEC - BAR_STALE_SEC - 1);
    expect(filterActive([stale])).toHaveLength(0);
  });

  it("excludes idle phase sessions", () => {
    const s = makeSession("a", "idle");
    expect(filterActive([s])).toHaveLength(0);
  });

  it("excludes ended phase sessions", () => {
    const s = makeSession("a", "ended");
    expect(filterActive([s])).toHaveLength(0);
  });

  it("returns empty array for empty input", () => {
    expect(filterActive([])).toEqual([]);
  });

  it("mixes visible and hidden phases correctly", () => {
    const sessions = [
      makeSession("a", "processing"),
      makeSession("b", "idle"),
      makeSession("c", "waiting_for_input", NOW_SEC - 10),
      makeSession("d", "ended"),
    ];
    const result = filterActive(sessions);
    expect(result.map((s) => s.session_id)).toEqual(["a", "c"]);
  });
});

describe("isSessionSleeping", () => {
  it("returns false for non-waiting_for_input phase", () => {
    expect(isSessionSleeping(makeSession("a", "processing"))).toBe(false);
    expect(isSessionSleeping(makeSession("a", "waiting_for_approval"))).toBe(false);
    expect(isSessionSleeping(makeSession("a", "idle"))).toBe(false);
  });

  it("returns false for waiting_for_input with recent activity", () => {
    const s = makeSession("a", "waiting_for_input", NOW_SEC - 10);
    expect(isSessionSleeping(s)).toBe(false);
  });

  it("returns true for waiting_for_input past stale threshold", () => {
    const s = makeSession("a", "waiting_for_input", NOW_SEC - BAR_STALE_SEC - 1);
    expect(isSessionSleeping(s)).toBe(true);
  });

  it("returns true when activity is exactly at stale threshold", () => {
    const s = makeSession("a", "waiting_for_input", NOW_SEC - BAR_STALE_SEC);
    expect(isSessionSleeping(s)).toBe(true);
  });
});

describe("activeKey", () => {
  it("returns empty string for empty array", () => {
    expect(activeKey([])).toBe("");
  });

  it("produces a string combining session ids and phases", () => {
    const sessions = [
      makeSession("abc", "processing"),
      makeSession("xyz", "idle"),
    ];
    expect(activeKey(sessions)).toBe("abc:processing,xyz:idle");
  });

  it("returns different keys for different phases", () => {
    const a = [makeSession("s1", "processing")];
    const b = [makeSession("s1", "idle")];
    expect(activeKey(a)).not.toBe(activeKey(b));
  });

  it("returns different keys for different session ids", () => {
    const a = [makeSession("s1", "processing")];
    const b = [makeSession("s2", "processing")];
    expect(activeKey(a)).not.toBe(activeKey(b));
  });
});
