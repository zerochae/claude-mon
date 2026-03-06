import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { sendMessage, type ChatMessage } from "@/services/tauri";
import { useChatMessages } from "@/hooks/useChatMessages";
import { groupMessages } from "@/utils/chat.utils";

export function useChat(sessionId: string, cwd: string, phase: string) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<ChatMessage | null>(
    null,
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, loading, isActive, hasMore, loadMore } = useChatMessages(
    sessionId,
    cwd,
    phase,
  );

  const allMessages = useMemo(() => {
    if (!pendingMessage) return messages;
    const exists = messages.some(
      (m) => m.role === "user" && m.content === pendingMessage.content,
    );
    if (exists) return messages;
    return [...messages, pendingMessage];
  }, [messages, pendingMessage]);

  const groups = useMemo(() => groupMessages(allMessages), [allMessages]);

  useEffect(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  }, [loading, allMessages.length, isActive]);

  const canSend = phase === "waiting_for_input" && !sending;

  const handleSend = useCallback(() => {
    if (!input.trim() || !canSend) return;
    const msg = input.trim();
    setInput("");
    setError(null);
    setSending(true);
    setPendingMessage({
      id: `pending-${Date.now()}`,
      role: "user",
      content: msg,
      timestamp: Math.floor(Date.now() / 1000),
    });
    sendMessage(sessionId, msg)
      .catch((err: unknown) => {
        setError(String(err));
        setPendingMessage(null);
      })
      .finally(() => setSending(false));
  }, [input, canSend, sessionId]);

  const hasInput = !!input.trim();

  return {
    input,
    setInput,
    error,
    scrollRef,
    loading,
    isActive,
    groups,
    canSend,
    hasInput,
    handleSend,
    hasMore,
    loadMore,
  };
}
