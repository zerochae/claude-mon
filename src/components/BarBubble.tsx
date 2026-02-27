import { useState, useEffect } from "react";
import { css, cva } from "@styled-system/css";
import { ProcessingSpinner } from "@/components/StatusBubble";

interface BarBubbleProps {
  phase: string;
  lastActivity: number;
}

const ACTIVE_PHASES = new Set(["processing", "running_tool", "compacting"]);

const wrapper = css({
  pointerEvents: "none",
  flexShrink: 0,
  marginTop: "-20px",
  marginLeft: "4px",
});

const bubble = css({
  pos: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  bg: "bg3",
  border: "0.5px solid token(colors.hairline)",
  borderRadius: "10px",
  padding: "0",
  w: "28px",
  h: "26px",
  shadow: "0 1px 3px rgba(0, 0, 0, 0.3)",
  whiteSpace: "nowrap",
  animation: "scale-in 200ms cubic-bezier(0.34, 1.56, 0.64, 1)",
  _after: {
    content: '""',
    pos: "absolute",
    left: "-4px",
    top: "4px",
    transform: "rotate(45deg)",
    w: "8px",
    h: "8px",
    bg: "bg3",
    borderRadius: "1px",
  },
});

const phaseContent = cva({
  base: {
    fontFamily: "SpaceMonoNerd",
  },
  variants: {
    phase: {
      processing: {
        color: "orange",
        fontSize: "15px",
        letterSpacing: "0.5px",
      },
      compacting: {
        color: "cyan",
        fontSize: "13px",
      },
      approval: {
        color: "red",
        fontSize: "15px",
        fontWeight: 700,
        animation: "bubble-blink 1s ease-in-out infinite",
      },
      done: {
        color: "red",
        fontSize: "15px",
        fontWeight: 700,
      },
    },
  },
});

function CompactingDots() {
  const [count, setCount] = useState(1);
  useEffect(() => {
    const timer = setInterval(() => setCount((c) => (c % 3) + 1), 400);
    return () => clearInterval(timer);
  }, []);
  return (
    <span className={phaseContent({ phase: "compacting" })}>
      {"·".repeat(count)}
    </span>
  );
}

export function BarBubble({ phase, lastActivity }: BarBubbleProps) {
  if (phase === "ended" || phase === "idle") return null;

  const isStale =
    ACTIVE_PHASES.has(phase) &&
    Math.floor(Date.now() / 1000) - lastActivity > 10;
  if (isStale) return null;

  let content: React.ReactNode;
  switch (phase) {
    case "processing":
    case "running_tool":
      content = <ProcessingSpinner />;
      break;
    case "compacting":
      content = <CompactingDots />;
      break;
    case "waiting_for_approval":
      content = <span className={phaseContent({ phase: "approval" })}></span>;
      break;
    case "waiting_for_input":
      content = <span className={phaseContent({ phase: "done" })}></span>;
      break;
    default:
      return null;
  }

  return (
    <div className={wrapper}>
      <div className={bubble}>{content}</div>
    </div>
  );
}
