import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { type ChatMessage, getChatMessages } from "@/services/tauri";

const PAGE_SIZE = 50;

export function useChatMessages(sessionId: string, cwd: string, phase: string) {
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [staleCount, setStaleCount] = useState(0);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [, startTransition] = useTransition();
  const prevCountRef = useRef(0);
  const prevSessionIdRef = useRef(sessionId);

  const loadMessages = useCallback(() => {
    getChatMessages(sessionId, cwd)
      .then((raw) => {
        startTransition(() => {
          if (prevSessionIdRef.current !== sessionId) {
            prevSessionIdRef.current = sessionId;
            prevCountRef.current = 0;
            setStaleCount(0);
            setVisibleCount(PAGE_SIZE);
            setAllMessages(raw);
            setLoading(false);
            return;
          }
          setAllMessages(raw);
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
    const delay = setTimeout(loadMessages, 300);
    const interval = setInterval(() => {
      if (document.visibilityState === "hidden") return;
      loadMessages();
    }, 3000);
    return () => {
      clearTimeout(delay);
      clearInterval(interval);
    };
  }, [loadMessages]);

  const messages =
    allMessages.length > visibleCount
      ? allMessages.slice(-visibleCount)
      : allMessages;

  const hasMore = allMessages.length > visibleCount;

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  }, []);

  const isActive =
    (phase === "processing" ||
      phase === "running_tool" ||
      phase === "compacting") &&
    staleCount < 3;

  return { messages, loading, isActive, hasMore, loadMore };
}
