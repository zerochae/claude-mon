import { useState, useRef, useEffect, useCallback, useTransition } from "react";
import { type ChatMessage, getChatMessages } from "@/services/tauri";

const MAX_MESSAGES = 50;

export function useChatMessages(sessionId: string, cwd: string, phase: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [staleCount, setStaleCount] = useState(0);
  const [, startTransition] = useTransition();
  const prevCountRef = useRef(0);
  const prevSessionIdRef = useRef(sessionId);

  const loadMessages = useCallback(() => {
    getChatMessages(sessionId, cwd)
      .then((raw) => {
        const msgs = raw.length > MAX_MESSAGES ? raw.slice(-MAX_MESSAGES) : raw;
        startTransition(() => {
          if (prevSessionIdRef.current !== sessionId) {
            prevSessionIdRef.current = sessionId;
            prevCountRef.current = 0;
            setStaleCount(0);
            setMessages(msgs);
            setLoading(false);
            return;
          }
          setMessages(msgs);
          setLoading(false);
          setStaleCount((prev) =>
            raw.length === prevCountRef.current ? prev + 1 : 0,
          );
          prevCountRef.current = raw.length;
        });
      })
      .catch(() => setLoading(false));
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

  return { messages, loading, isActive };
}
