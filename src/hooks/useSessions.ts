import { useState, useEffect, useCallback, useRef } from "react";
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
  const lastEventRef = useRef(0);

  useEffect(() => {
    if (!isTauri) return;

    const fetchSessions = () => {
      getSessions()
        .then(setSessions)
        .catch(() => undefined);
    };

    fetchSessions();

    const unlistenPromise = listenSessionUpdate((updated) => {
      lastEventRef.current = Date.now();
      setSessions(updated);
    });

    const pollId = setInterval(() => {
      if (Date.now() - lastEventRef.current > 5000) {
        fetchSessions();
      }
    }, 5000);

    return () => {
      clearInterval(pollId);
      void unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);

  const optimisticClear = useCallback((sessionId: string) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.session_id === sessionId
          ? { ...s, phase: "processing", tool_use_id: null }
          : s,
      ),
    );
  }, []);

  const approve = useCallback(
    (sessionId: string, toolUseId: string) => {
      if (!isTauri) return Promise.resolve();
      optimisticClear(sessionId);
      return approvePermission(sessionId, toolUseId).catch(() => undefined);
    },
    [optimisticClear],
  );

  const deny = useCallback(
    (sessionId: string, toolUseId: string, reason?: string) => {
      if (!isTauri) return Promise.resolve();
      optimisticClear(sessionId);
      return denyPermission(sessionId, toolUseId, reason).catch(
        () => undefined,
      );
    },
    [optimisticClear],
  );

  return { sessions, approve, deny };
}
