export type SessionPhase =
  | "idle"
  | "processing"
  | "running_tool"
  | "compacting"
  | "waiting_for_approval"
  | "waiting_for_input"
  | "ended";

export const ACTIVE_PHASES = new Set<SessionPhase>([
  "processing",
  "running_tool",
  "compacting",
]);

export const DONE_PHASES = new Set<SessionPhase>(["idle"]);

export const BAR_VISIBLE_PHASES = new Set<SessionPhase>([
  "processing",
  "running_tool",
  "compacting",
  "waiting_for_approval",
  "waiting_for_input",
]);

export const STALE_THRESHOLD_SEC = 30;

export const PHASE_LABELS: Record<SessionPhase, string> = {
  idle: "Idle",
  processing: "Processing...",
  running_tool: "Running tool",
  compacting: "Compacting context",
  waiting_for_input: "Waiting for input",
  waiting_for_approval: "Waiting for approval",
  ended: "Session ended",
};
