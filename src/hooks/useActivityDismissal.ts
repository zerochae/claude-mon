import { useCallback, useMemo, useState } from "react";

import { type SessionState } from "@/services/tauri";

export function useActivityDismissal(sessions: SessionState[]) {
  const [dismissedActivity, setDismissedActivity] = useState<
    Map<string, number>
  >(new Map());

  const dismissedIds = useMemo(() => {
    const result = new Set<string>();
    for (const s of sessions) {
      const dismissedAt = dismissedActivity.get(s.session_id);
      if (dismissedAt !== undefined && dismissedAt === s.last_activity) {
        result.add(s.session_id);
      }
    }
    return result;
  }, [sessions, dismissedActivity]);

  const dismiss = useCallback((sessionId: string, lastActivity: number) => {
    setDismissedActivity((prev) => {
      const next = new Map(prev);
      next.set(sessionId, lastActivity);
      return next;
    });
  }, []);

  return { dismissedIds, dismiss };
}
