import { useState, useRef, useEffect } from "react";
import { sendMessage } from "@/services/tauri";
import { useChatMessages } from "@/hooks/useChatMessages";
import { groupMessages } from "@/utils/chat.utils";

export function useChat(sessionId: string, cwd: string, phase: string) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, loading, isActive } = useChatMessages(
    sessionId,
    cwd,
    phase,
  );
  const groups = groupMessages(messages);

  useEffect(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  }, [loading, messages.length, isActive]);

  const canSend = phase === "waiting_for_input" && !sending;

  const handleSend = () => {
    if (!input.trim() || !canSend) return;
    const msg = input.trim();
    setInput("");
    setError(null);
    setSending(true);
    sendMessage(sessionId, msg)
      .catch((err: unknown) => setError(String(err)))
      .finally(() => setSending(false));
  };

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
  };
}
