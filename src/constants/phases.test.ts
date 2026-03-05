import { describe, it, expect } from "vitest";
import {
  PHASE_LABELS,
  ACTIVE_PHASES,
  DONE_PHASES,
  BAR_VISIBLE_PHASES,
  type SessionPhase,
} from "./phases";

const ALL_PHASES: SessionPhase[] = [
  "idle",
  "processing",
  "running_tool",
  "compacting",
  "waiting_for_approval",
  "waiting_for_input",
  "ended",
];

describe("PHASE_LABELS", () => {
  it("has a label for every SessionPhase", () => {
    for (const phase of ALL_PHASES) {
      expect(PHASE_LABELS[phase]).toBeDefined();
      expect(typeof PHASE_LABELS[phase]).toBe("string");
      expect(PHASE_LABELS[phase].length).toBeGreaterThan(0);
    }
  });

  it("has no extra keys beyond SessionPhase values", () => {
    expect(Object.keys(PHASE_LABELS).sort()).toEqual([...ALL_PHASES].sort());
  });
});

describe("ACTIVE_PHASES", () => {
  it("contains processing, running_tool, compacting", () => {
    expect(ACTIVE_PHASES.has("processing")).toBe(true);
    expect(ACTIVE_PHASES.has("running_tool")).toBe(true);
    expect(ACTIVE_PHASES.has("compacting")).toBe(true);
  });

  it("does not contain idle, ended, or waiting phases", () => {
    expect(ACTIVE_PHASES.has("idle")).toBe(false);
    expect(ACTIVE_PHASES.has("ended")).toBe(false);
    expect(ACTIVE_PHASES.has("waiting_for_input")).toBe(false);
    expect(ACTIVE_PHASES.has("waiting_for_approval")).toBe(false);
  });
});

describe("DONE_PHASES", () => {
  it("contains idle", () => {
    expect(DONE_PHASES.has("idle")).toBe(true);
  });

  it("does not contain active phases", () => {
    expect(DONE_PHASES.has("processing")).toBe(false);
    expect(DONE_PHASES.has("running_tool")).toBe(false);
  });
});

describe("BAR_VISIBLE_PHASES", () => {
  it("contains all active and waiting phases", () => {
    expect(BAR_VISIBLE_PHASES.has("processing")).toBe(true);
    expect(BAR_VISIBLE_PHASES.has("running_tool")).toBe(true);
    expect(BAR_VISIBLE_PHASES.has("compacting")).toBe(true);
    expect(BAR_VISIBLE_PHASES.has("waiting_for_approval")).toBe(true);
    expect(BAR_VISIBLE_PHASES.has("waiting_for_input")).toBe(true);
  });

  it("does not contain idle or ended", () => {
    expect(BAR_VISIBLE_PHASES.has("idle")).toBe(false);
    expect(BAR_VISIBLE_PHASES.has("ended")).toBe(false);
  });
});
