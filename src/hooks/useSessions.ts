import { useState, useEffect } from "react";
import {
  getSessions,
  listenSessionUpdate,
  approvePermission,
  denyPermission,
  SessionState,
} from "@/lib/tauri";
import { MOCK_SESSIONS } from "@/lib/mockSessions";

const isTauri = "__TAURI_INTERNALS__" in window;

export function useSessions() {
  const [sessions, setSessions] = useState<SessionState[]>(() =>
    isTauri ? [] : MOCK_SESSIONS,
  );

  useEffect(() => {
    if (!isTauri) return;

    getSessions()
      .then((initial) => {
        setSessions(initial);
      })
      .catch(() => undefined);

    const unlistenPromise = listenSessionUpdate((updated) => {
      setSessions(updated);
    });

    return () => {
      void unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);

  const approve = (sessionId: string, toolUseId: string) => {
    if (!isTauri) return Promise.resolve();
    return approvePermission(sessionId, toolUseId);
  };

  const deny = (sessionId: string, toolUseId: string, reason?: string) => {
    if (!isTauri) return Promise.resolve();
    return denyPermission(sessionId, toolUseId, reason);
  };

  return { sessions, approve, deny };
}
