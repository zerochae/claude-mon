import { useState, useEffect } from "react";
import {
  getSessions,
  listenSessionUpdate,
  approvePermission,
  denyPermission,
  SessionState,
} from "@/services/tauri";
import { MOCK_SESSIONS } from "@/mocks/mockSessions";

const isTauri = "__TAURI_INTERNALS__" in window;

export function useSessions() {
  const [sessions, setSessions] = useState<SessionState[]>(() =>
    isTauri ? [] : MOCK_SESSIONS,
  );

  useEffect(() => {
    if (!isTauri) return;

    const fetchSessions = () => {
      getSessions()
        .then(setSessions)
        .catch(() => undefined);
    };

    fetchSessions();

    const unlistenPromise = listenSessionUpdate((updated) => {
      setSessions(updated);
    });

    const pollId = setInterval(fetchSessions, 2000);

    return () => {
      clearInterval(pollId);
      void unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);

  const optimisticClear = (sessionId: string) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.session_id === sessionId
          ? { ...s, phase: "processing", tool_use_id: null }
          : s,
      ),
    );
  };

  const approve = (sessionId: string, toolUseId: string) => {
    if (!isTauri) return Promise.resolve();
    optimisticClear(sessionId);
    return approvePermission(sessionId, toolUseId).catch(() => undefined);
  };

  const deny = (sessionId: string, toolUseId: string, reason?: string) => {
    if (!isTauri) return Promise.resolve();
    optimisticClear(sessionId);
    return denyPermission(sessionId, toolUseId, reason).catch(() => undefined);
  };

  return { sessions, approve, deny };
}
