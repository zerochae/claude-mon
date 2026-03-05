import { useState, useRef, useEffect } from "react";
import { Markdown } from "@/components/Markdown";
import { ChatMessage, sendMessage } from "@/lib/tauri";
import { useChatMessages } from "@/hooks/useChatMessages";
import { ProcessingSpinner } from "@/components/StatusBubble";
import { Button } from "@/components/Button";
import {
  userBubbleWrap,
  userBubble,
  assistantWrap,
  toolWrap,
  toolButton,
  svgFlexShrink,
  chevron,
  toolExpanded,
  messageGroup,
  thinkingWrap,
  outerContainer,
  scrollArea,
  inputBar,
  chatInput,
} from "./ChatView.styles";

interface ChatViewProps {
  sessionId: string;
  cwd: string;
  phase: string;
}

function UserMessage({ message }: { message: ChatMessage }) {
  return (
    <div className={userBubbleWrap}>
      <div className={userBubble}>
        <Markdown content={message.content} />
      </div>
    </div>
  );
}

function AssistantMessage({ message }: { message: ChatMessage }) {
  return (
    <div className={assistantWrap}>
      <Markdown content={message.content} />
    </div>
  );
}

function ToolMessage({ message }: { message: ChatMessage }) {
  const [expanded, setExpanded] = useState(true);
  const isRunning = message.tool_status === "running";
  const isError = message.tool_status === "error";

  return (
    <div className={toolWrap}>
      <button onClick={() => setExpanded(!expanded)} className={toolButton}>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={svgFlexShrink}
        >
          {isRunning ? (
            <circle
              cx="6"
              cy="6"
              r="3"
              stroke="var(--colors-yellow, #e5c07b)"
              strokeWidth="1.5"
              strokeDasharray="4 3"
              fill="none"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 6 6"
                to="360 6 6"
                dur="1s"
                repeatCount="indefinite"
              />
            </circle>
          ) : isError ? (
            <circle
              cx="6"
              cy="6"
              r="3.5"
              fill="var(--colors-red, #E06C75)"
              opacity="0.8"
            />
          ) : (
            <path
              d="M3 6l2 2 4-4"
              stroke="var(--colors-green, #98c379)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          )}
        </svg>
        <span>{message.tool_name}</span>
        <svg
          width="8"
          height="8"
          viewBox="0 0 8 8"
          fill="currentColor"
          className={chevron({ expanded })}
        >
          <path
            d="M2.5 1L6 4L2.5 7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      </button>
      {expanded && (
        <div className={toolExpanded}>
          <Markdown content={message.content} />
        </div>
      )}
    </div>
  );
}

function MessageGroup({ messages }: { messages: ChatMessage[] }) {
  const role = messages[0].role;
  return (
    <div className={messageGroup({ role })}>
      {messages.map((msg) => {
        switch (msg.role) {
          case "user":
            return <UserMessage key={msg.id} message={msg} />;
          case "assistant":
            return <AssistantMessage key={msg.id} message={msg} />;
          case "tool":
            return <ToolMessage key={msg.id} message={msg} />;
        }
      })}
    </div>
  );
}

function groupMessages(messages: ChatMessage[]): ChatMessage[][] {
  const groups: ChatMessage[][] = [];
  let current: ChatMessage[] = [];

  for (const msg of messages) {
    if (current.length === 0 || current[0].role === msg.role) {
      current.push(msg);
    } else {
      groups.push(current);
      current = [msg];
    }
  }
  if (current.length > 0) groups.push(current);
  return groups;
}

function ThinkingIndicator() {
  return (
    <div className={thinkingWrap}>
      <ProcessingSpinner />
    </div>
  );
}

export function ChatView({ sessionId, cwd, phase }: ChatViewProps) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, isActive } = useChatMessages(sessionId, cwd, phase);
  const groups = groupMessages(messages);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, isActive]);

  const canSend = phase === "waiting_for_input" && !sending;

  const handleSend = () => {
    if (!input.trim() || !canSend) return;
    const msg = input.trim();
    setInput("");
    setError(null);
    setSending(true);
    sendMessage(sessionId, msg)
      .catch((err) => setError(String(err)))
      .finally(() => setSending(false));
  };

  const hasInput = !!input.trim();

  return (
    <div className={outerContainer}>
      <div ref={scrollRef} className={scrollArea}>
        {groups.map((group) => (
          <MessageGroup key={group[0].id} messages={group} />
        ))}
        {isActive && <ThinkingIndicator />}
      </div>

      {error && (
        <div style={{ padding: "2px 8px", color: "var(--colors-red, #E06C75)", fontSize: "11px" }}>
          {error}
        </div>
      )}
      <div className={inputBar}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={!canSend}
          placeholder={canSend ? "Message..." : "Waiting..."}
          className={chatInput}
        />
        <Button
          variant={hasInput ? "solid" : "ghost"}
          size="icon"
          color="primary"
          shape="default"
          disabled={!hasInput || !canSend}
          onClick={handleSend}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M6 10V2M6 2L2.5 5.5M6 2L9.5 5.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Button>
      </div>
    </div>
  );
}
