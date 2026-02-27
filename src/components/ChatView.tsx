import { useState, useRef, useEffect, useCallback } from "react";
import { css, cva } from "@styled-system/css";
import { Markdown } from "@/components/Markdown";
import { ChatMessage, getChatMessages } from "@/lib/tauri";
import { ProcessingSpinner } from "@/components/StatusBubble";
import { MOTION } from "@/lib/motion";
import { Button } from "@/components/Button";

interface ChatViewProps {
  sessionId: string;
  cwd: string;
  phase: string;
}

const userBubbleWrap = css({
  display: "flex",
  justifyContent: "flex-end",
  px: "16px",
});

const userBubble = css({
  bg: "bg4",
  borderRadius: "12px 12px 4px 12px",
  padding: "0.4rem 0.65rem",
  maxW: "80%",
});

const assistantWrap = css({ px: "16px" });

const toolWrap = css({ px: "16px" });

const toolButton = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "5px",
  bg: "transparent",
  border: "none",
  cursor: "pointer",
  padding: "2px 4px",
  borderRadius: "4px",
  fontSize: "0.78rem",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  color: "comment",
  transition: MOTION.transition.color,
  _hover: { color: "text", bg: "surfaceHover" },
  _active: { transform: "scale(0.97)" },
});

const svgFlexShrink = css({ flexShrink: 0 });

const chevron = cva({
  base: {
    transition: "transform 0.15s ease",
    opacity: 0.5,
  },
  variants: {
    expanded: {
      true: { transform: "rotate(90deg)" },
      false: { transform: "rotate(0deg)" },
    },
  },
  defaultVariants: { expanded: false },
});

const toolExpanded = css({
  mt: "3px",
  pl: "0.5rem",
  borderLeft: "1px solid token(colors.hairline)",
});

const messageGroup = cva({
  base: {
    display: "flex",
    flexDirection: "column",
  },
  variants: {
    role: {
      tool: { gap: "2px", pt: "4px", pb: "2px" },
      user: { gap: "6px", pt: "8px", pb: "4px" },
      assistant: { gap: "6px", pt: "4px", pb: "2px" },
    },
  },
});

const thinkingWrap = css({
  px: "16px",
  pt: "6px",
  pb: "4px",
});

const outerContainer = css({
  display: "flex",
  flexDirection: "column",
  flex: 1,
  overflow: "hidden",
});

const scrollArea = css({
  flex: 1,
  overflowY: "auto",
  overflowX: "hidden",
  pt: "4px",
  pb: "4px",
  animation: "fade-in 150ms cubic-bezier(0.2, 0, 0, 1)",
});

const inputBar = css({
  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: "6px 8px",
  borderTop: "0.5px solid token(colors.hairline)",
  bg: "transparent",
  flexShrink: 0,
});

const chatInput = css({
  flex: 1,
  bg: "surfaceOverlay",
  border: "0.5px solid token(colors.hairline)",
  borderRadius: "6px",
  padding: "6px 10px",
  color: "text",
  fontSize: "12px",
  outline: "none",
  fontFamily: "inherit",
  transition:
    "border-color 120ms cubic-bezier(0.2, 0, 0, 1), box-shadow 120ms cubic-bezier(0.2, 0, 0, 1)",
  _focus: {
    borderColor: "rgba(97, 175, 239, 0.5)",
    shadow: "0 0 0 2px rgba(97, 175, 239, 0.15)",
  },
});

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const groups = groupMessages(messages);

  const loadMessages = useCallback(() => {
    getChatMessages(sessionId, cwd)
      .then((msgs) => {
        setMessages(msgs);
        setStaleCount((prev) =>
          msgs.length === prevCountRef.current ? prev + 1 : 0,
        );
        prevCountRef.current = msgs.length;
      })
      .catch(() => {});
  }, [sessionId, cwd]);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  useEffect(() => {
    setStaleCount(0);
    prevCountRef.current = 0;
  }, [sessionId]);

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
