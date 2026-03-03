import { useState, useEffect, useRef } from "react";
import { css, cva } from "@styled-system/css";

const STALE_THRESHOLD_SEC = 10;
const DONE_VISIBLE_SEC = 4;
const FADE_OUT_MS = 300;

interface StatusBubbleProps {
  phase: string;
  lastActivity: number;
  dismissed?: boolean;
  disableStale?: boolean;
}

const SPINNER_SYMBOLS = ["·", "✢", "✳", "∗", "✻", "✽"];

const phaseContent = cva({
  base: {
    fontFamily: "SpaceMonoNerd",
  },
  variants: {
    phase: {
      processing: {
        color: "orange",
        fontSize: "13px",
        letterSpacing: "1px",
      },
      compacting: {
        color: "cyan",
        fontSize: "11px",
      },
      approval: {
        color: "red",
        fontSize: "12px",
        fontWeight: 700,
        animation: "bubble-blink 1s ease-in-out infinite",
      },
      done: {
        color: "green",
        fontSize: "12px",
        fontWeight: 700,
      },
      idle: {
        color: "gray",
        fontSize: "9px",
        letterSpacing: "0.5px",
      },
    },
  },
});

export function ProcessingSpinner() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % SPINNER_SYMBOLS.length);
    }, 150);
    return () => clearInterval(timer);
  }, []);

  return (
    <span className={phaseContent({ phase: "processing" })}>
      {SPINNER_SYMBOLS[index]}
    </span>
  );
}

function CompactingDots() {
  const [count, setCount] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setCount((c) => (c % 3) + 1);
    }, 400);
    return () => clearInterval(timer);
  }, []);

  return (
    <span className={phaseContent({ phase: "compacting" })}>
      {"·".repeat(count)}
    </span>
  );
}

const bubbleWrapper = css({ pos: "relative" });

const bubbleStyle = css({
  pos: "absolute",
  bottom: "100%",
  left: "50%",
  transform: "translateX(-50%)",
  mb: "6px",
  bg: "bg3",
  border: "0.5px solid token(colors.hairline)",
  borderRadius: "8px",
  padding: "3px 7px",
  whiteSpace: "nowrap",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minW: "24px",
  minH: "20px",
  shadow: "0 1px 3px rgba(0, 0, 0, 0.3), 0 4px 12px rgba(0, 0, 0, 0.15)",
  animation: "scale-in 200ms cubic-bezier(0.34, 1.56, 0.64, 1)",
});

const tailStyle = css({
  pos: "absolute",
  top: "100%",
  left: "50%",
  transform: "translateX(-50%)",
  w: 0,
  h: 0,
  borderLeft: "4px solid transparent",
  borderRight: "4px solid transparent",
  borderTop: "4px solid token(colors.bg3)",
});

const ACTIVE_PHASES = new Set(["processing", "running_tool", "compacting"]);
const DONE_PHASES = new Set(["waiting_for_input", "idle"]);

export function StatusBubble({
  phase,
  lastActivity,
  dismissed,
  disableStale,
}: StatusBubbleProps) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  const [doneAt, setDoneAt] = useState<number | null>(null);
  const [hidden, setHidden] = useState(false);
  const prevPhaseRef = useRef(phase);

  useEffect(() => {
    const timer = setInterval(
      () => setNow(Math.floor(Date.now() / 1000)),
      1000,
    );
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const wasActive = ACTIVE_PHASES.has(prevPhaseRef.current);
    prevPhaseRef.current = phase;
    if (DONE_PHASES.has(phase) && wasActive) {
      const t = Math.floor(Date.now() / 1000);
      queueMicrotask(() => {
        setHidden(false);
        setDoneAt((prev) => prev ?? t);
      });
    } else if (!DONE_PHASES.has(phase)) {
      queueMicrotask(() => {
        setHidden(false);
        setDoneAt(null);
      });
    }
  }, [phase]);

  const isActivePhase =
    phase === "processing" ||
    phase === "running_tool" ||
    phase === "compacting";
  const isStale =
    !disableStale && isActivePhase && now - lastActivity > STALE_THRESHOLD_SEC;
  const effectivePhase = dismissed && isStale ? "idle" : phase;

  const isDoneExpired =
    DONE_PHASES.has(effectivePhase) &&
    doneAt !== null &&
    now - doneAt > DONE_VISIBLE_SEC;

  useEffect(() => {
    if (!isDoneExpired || hidden) return;
    const timer = setTimeout(() => setHidden(true), FADE_OUT_MS);
    return () => clearTimeout(timer);
  }, [isDoneExpired, hidden]);

  if (phase === "ended" || hidden) return null;

  let content: React.ReactNode;

  switch (effectivePhase) {
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
    case "idle":
      content = <span className={phaseContent({ phase: "done" })}></span>;
      break;
    default:
      return null;
  }

  const fading = isDoneExpired && !hidden;

  return (
    <div className={bubbleWrapper}>
      <div
        className={bubbleStyle}
        style={
          fading
            ? { animation: `scale-out ${FADE_OUT_MS}ms ease forwards` }
            : undefined
        }
      >
        {content}
        <div className={tailStyle} />
      </div>
    </div>
  );
}
