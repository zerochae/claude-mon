import { useBubbleLifecycle } from "@/hooks/useBubbleLifecycle";
import {
  ProcessingSpinner,
  CompactingDots,
} from "@/components/PhaseIndicators";
import { ACTIVE_PHASES, DONE_PHASES } from "@/lib/phases";
import {
  STALE_THRESHOLD_SEC,
  DONE_VISIBLE_SEC,
  FADE_OUT_MS,
  SB_DONE_PHASES,
  phaseContent,
  wrapper,
  bubble,
  tailStyle,
} from "./Bubble.styles";
import { ui } from "@/lib/glyph";

type BubbleVariant = "bar" | "chat" | "house";
type BubbleSize = "lg" | "md" | "sm";

const VARIANT_SIZE: Record<BubbleVariant, BubbleSize> = {
  bar: "lg",
  chat: "sm",
  house: "md",
};

interface BubbleProps {
  variant: BubbleVariant;
  phase: string;
  lastActivity: number;
  dismissed?: boolean;
  disableStale?: boolean;
}

export function Bubble({
  variant,
  phase,
  lastActivity,
  dismissed,
  disableStale,
}: BubbleProps) {
  const isHouse = variant === "house";
  const donePhasesSet = isHouse ? SB_DONE_PHASES : DONE_PHASES;

  const { visible, fading, fadeOutMs, now } = useBubbleLifecycle({
    phase,
    lastActivity,
    donePhasesSet,
    activePhasesSet: ACTIVE_PHASES,
    doneVisibleSec: isHouse ? DONE_VISIBLE_SEC : undefined,
    fadeOutMs: FADE_OUT_MS,
    staleThresholdSec: isHouse ? STALE_THRESHOLD_SEC : undefined,
    disableStale: isHouse ? (disableStale ?? false) || (dismissed ?? false) : true,
  });

  const isActivePhase = ACTIVE_PHASES.has(
    phase as "processing" | "running_tool" | "compacting",
  );
  const isStale =
    isHouse && !disableStale && isActivePhase && now - lastActivity > STALE_THRESHOLD_SEC;
  const effectivePhase = isHouse && dismissed && isStale ? "idle" : phase;

  if (phase === "ended" || !visible) return null;

  const size = VARIANT_SIZE[variant];
  let content: React.ReactNode;

  switch (effectivePhase) {
    case "processing":
    case "running_tool":
      content = (
        <ProcessingSpinner className={phaseContent({ phase: "processing", size })} />
      );
      break;
    case "compacting":
      content = (
        <CompactingDots className={phaseContent({ phase: "compacting", size })} />
      );
      break;
    case "waiting_for_approval":
      content = (
        <span className={phaseContent({ phase: "approval", size })}>
          {ui.bubble_waiting_for_approval}
        </span>
      );
      break;
    case "waiting_for_input":
      content = (
        <span className={phaseContent({ phase: "input", size })}>
          {ui.bubble_waiting_for_input}
        </span>
      );
      break;
    case "idle":
      content = <span className={phaseContent({ phase: "idle", size })}></span>;
      break;
    default:
      return null;
  }

  return (
    <div className={wrapper({ variant })}>
      <div
        className={bubble({ variant })}
        style={
          fading
            ? { animation: `scale-out ${fadeOutMs}ms ease forwards` }
            : undefined
        }
      >
        {content}
        {isHouse && <div className={tailStyle} />}
      </div>
    </div>
  );
}
