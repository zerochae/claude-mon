import { useBubbleLifecycle } from "@/hooks/useBubbleLifecycle";
import { ProcessingSpinner, CompactingDots } from "@/components/PhaseIndicators";
import { ACTIVE_PHASES, DONE_PHASES } from "@/lib/phases";
import {
  FADE_OUT_MS,
  wrapper,
  bubble,
  phaseContent,
} from "./BarBubble.styles";

interface BarBubbleProps {
  phase: string;
  lastActivity: number;
}

export function BarBubble({ phase, lastActivity }: BarBubbleProps) {
  const { visible, fading, fadeOutMs } = useBubbleLifecycle({
    phase,
    lastActivity,
    donePhasesSet: DONE_PHASES,
    activePhasesSet: ACTIVE_PHASES,
    fadeOutMs: FADE_OUT_MS,
  });

  if (phase === "ended" || !visible) return null;

  let content: React.ReactNode;
  switch (phase) {
    case "processing":
    case "running_tool":
      content = (
        <ProcessingSpinner className={phaseContent({ phase: "processing" })} />
      );
      break;
    case "compacting":
      content = (
        <CompactingDots className={phaseContent({ phase: "compacting" })} />
      );
      break;
    case "waiting_for_approval":
      content = <span className={phaseContent({ phase: "approval" })}>󱈸</span>;
      break;
    case "waiting_for_input":
      content = <span className={phaseContent({ phase: "input" })}></span>;
      break;
    case "idle":
      content = <span className={phaseContent({ phase: "idle" })}>zZZ</span>;
      break;
    default:
      return null;
  }

  return (
    <div className={wrapper}>
      <div
        className={bubble}
        style={
          fading
            ? { animation: `scale-out ${fadeOutMs}ms ease forwards` }
            : undefined
        }
      >
        {content}
      </div>
    </div>
  );
}
