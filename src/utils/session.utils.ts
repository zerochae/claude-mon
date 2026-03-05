import { SessionState } from "@/services/tauri";
import { BAR_VISIBLE_PHASES, STALE_THRESHOLD_SEC } from "@/constants/phases";

export function filterActive(sessions: SessionState[]) {
  const now = Math.floor(Date.now() / 1000);
  return sessions.filter(
    (s) =>
      s.phase !== "ended" &&
      (BAR_VISIBLE_PHASES.has(s.phase) ||
        now - s.last_activity < STALE_THRESHOLD_SEC),
  );
}

export function activeKey(sessions: SessionState[]) {
  return sessions.map((s) => `${s.session_id}:${s.phase}`).join();
}

const PHASE_PRIORITY: Record<string, number> = {
  waiting_for_approval: 0,
  waiting_for_input: 1,
  processing: 2,
  ended: 4,
};

export function sortByPriority(sessions: SessionState[]) {
  return [...sessions].sort(
    (a, b) => (PHASE_PRIORITY[a.phase] ?? 3) - (PHASE_PRIORITY[b.phase] ?? 3),
  );
}
