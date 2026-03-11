import { SessionState } from "@/services/tauri";
import { BAR_VISIBLE_PHASES, BAR_STALE_SEC, ACTIVE_PHASES } from "@/constants/phases";

function getBarStaleSec(): number {
  const v = getComputedStyle(document.documentElement).getPropertyValue("--bar-stale-sec").trim();
  return v ? Number(v) : BAR_STALE_SEC;
}

export function filterActive(sessions: SessionState[]) {
  const now = Math.floor(Date.now() / 1000);
  const staleSec = getBarStaleSec();
  return sessions.filter(
    (s) =>
      BAR_VISIBLE_PHASES.has(s.phase) &&
      (ACTIVE_PHASES.has(s.phase) ||
        s.phase === "waiting_for_approval" ||
        now - s.last_activity < staleSec),
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
