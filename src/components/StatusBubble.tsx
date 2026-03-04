import { useBubbleLifecycle } from "@/hooks/useBubbleLifecycle";
import {
  ProcessingSpinner,
  CompactingDots,
} from "@/components/PhaseIndicators";
import { ACTIVE_PHASES } from "@/lib/phases";
import {
  STALE_THRESHOLD_SEC,
  DONE_VISIBLE_SEC,
  FADE_OUT_MS,
  SB_DONE_PHASES,
  phaseContent,
  bubbleWrapper,
  bubbleStyle,
  tailStyle,
} from "./StatusBubble.styles";
import { ui } from "@/lib/glyph";

export { ProcessingSpinner } from "@/components/PhaseIndicators";

interface StatusBubbleProps {
  phase: string;
  lastActivity: number;
  dismissed?: boolean;
  disableStale?: boolean;
}

export function StatusBubble({
  phase,
  lastActivity,
  dismissed,
  disableStale,
}: StatusBubbleProps) {
  const { visible, fading, fadeOutMs, now } = useBubbleLifecycle({
    phase,
    lastActivity,
    donePhasesSet: SB_DONE_PHASES,
    activePhasesSet: ACTIVE_PHASES,
    doneVisibleSec: DONE_VISIBLE_SEC,
    fadeOutMs: FADE_OUT_MS,
    staleThresholdSec: STALE_THRESHOLD_SEC,
    disableStale: (disableStale ?? false) || (dismissed ?? false),
  });

  const isActivePhase = ACTIVE_PHASES.has(
    phase as "processing" | "running_tool" | "compacting",
  );
  const isStale =
    !disableStale && isActivePhase && now - lastActivity > STALE_THRESHOLD_SEC;
  const effectivePhase = dismissed && isStale ? "idle" : phase;

  if (phase === "ended" || !visible) return null;

  let content: React.ReactNode;

  switch (effectivePhase) {
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
      content = (
        <span className={phaseContent({ phase: "approval" })}>
          {ui.bubble_waiting_for_approval}
        </span>
      );
      break;
    case "waiting_for_input":
      content = (
        <span className={phaseContent({ phase: "done" })}>
          {ui.bubble_waiting_for_input}
        </span>
      );
      break;
    case "idle":
      content = <span className={phaseContent({ phase: "idle" })}></span>;
      break;
    default:
      return null;
  }

  return (
    <div className={bubbleWrapper}>
      <div
        className={bubbleStyle}
        style={
          fading
            ? { animation: `scale-out ${fadeOutMs}ms ease forwards` }
            : undefined
        }
      >
        {content}
        <div className={tailStyle} />
      </div>
    </div>
  );
}
