import { ACTIVE_PHASES, DONE_PHASES } from "@/constants/phases";
import { useBubbleLifecycle } from "@/hooks/useBubbleLifecycle";
import { FADE_OUT_MS } from "@/styles/Bubble.styles";

const BUBBLE_DONE_PHASES = new Set([...DONE_PHASES, "waiting_for_input"]);
const BUBBLE_DONE_VISIBLE_SEC = 30;

type BubbleVariant = "bar" | "chat" | "stage";

interface UseBubbleParams {
  variant: BubbleVariant;
  phase: string;
  lastActivity: number;
  dismissed?: boolean;
  disableStale?: boolean;
}

export function useBubble({
  variant,
  phase,
  lastActivity,
}: UseBubbleParams) {
  const { visible, fading, fadeOutMs } = useBubbleLifecycle({
    phase,
    lastActivity,
    donePhasesSet: BUBBLE_DONE_PHASES,
    activePhasesSet: ACTIVE_PHASES,
    doneVisibleSec: BUBBLE_DONE_VISIBLE_SEC,
    fadeOutMs: FADE_OUT_MS,
    disableStale: true,
  });

  return {
    isStage: variant === "stage",
    visible,
    fading,
    fadeOutMs,
    effectivePhase: phase,
  };
}
