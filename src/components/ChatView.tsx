import { useState, useRef, useEffect, useCallback } from "react";
import { Markdown } from "@/components/Markdown";
import { ChatMessage, getChatMessages } from "@/lib/tauri";
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [staleCount, setStaleCount] = useState(0);
  const prevCountRef = useRef(0);
  const prevSessionIdRef = useRef(sessionId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const groups = groupMessages(messages);

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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, isActive]);

  const handleSend = () => {
    if (!input.trim()) return;
    setInput("");
  };

  const hasInput = !!input.trim();

  return (
    <div className={outerContainer}>
      <div ref={scrollRef} className={scrollArea}>
        {groups.map((group, i) => (
          <MessageGroup key={i} messages={group} />
        ))}
        {isActive && <ThinkingIndicator />}
      </div>

      <div className={inputBar}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Message..."
          className={chatInput}
        />
        <Button
          variant={hasInput ? "solid" : "ghost"}
          size="icon"
          color="primary"
          shape="default"
          disabled={!hasInput}
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
