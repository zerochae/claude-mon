import { useState, useRef, useEffect, useCallback } from "react";
import { type ChatMessage, getChatMessages } from "@/lib/tauri";

export function useChatMessages(
  sessionId: string,
  cwd: string,
  phase: string,
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [staleCount, setStaleCount] = useState(0);
  const prevCountRef = useRef(0);
  const prevSessionIdRef = useRef(sessionId);

  const loadMessages = useCallback(() => {
    getChatMessages(sessionId, cwd)
      .then((msgs) => {
        if (prevSessionIdRef.current !== sessionId) {
          prevSessionIdRef.current = sessionId;
          prevCountRef.current = 0;
          setStaleCount(0);
          setMessages(msgs);
          return;
        }
        setMessages(msgs);
        setStaleCount((prev) =>
          msgs.length === prevCountRef.current ? prev + 1 : 0,
        );
        prevCountRef.current = msgs.length;
      })
      .catch(() => undefined);
  }, [sessionId, cwd]);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  const isActive =
    (phase === "processing" ||
      phase === "running_tool" ||
      phase === "compacting") &&
    staleCount < 3;

  return { messages, isActive };
}
