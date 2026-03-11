import { useBubbleLifecycle } from "@/hooks/useBubbleLifecycle";
import { ACTIVE_PHASES, DONE_PHASES } from "@/constants/phases";
import {
  STALE_THRESHOLD_SEC,
  DONE_VISIBLE_SEC,
  FADE_OUT_MS,
  SB_DONE_PHASES,
} from "@/styles/Bubble.styles";

function getBubbleDoneSec(): number {
  const v = getComputedStyle(document.documentElement).getPropertyValue("--bubble-done-sec").trim();
  return v ? Number(v) : 60;
}

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
  dismissed,
  disableStale,
}: UseBubbleParams) {
  const isStage = variant === "stage";
  const donePhasesSet = isStage ? SB_DONE_PHASES : DONE_PHASES;

  const { visible, fading, fadeOutMs, now } = useBubbleLifecycle({
    phase,
    lastActivity,
    donePhasesSet,
    activePhasesSet: ACTIVE_PHASES,
    doneVisibleSec: isStage ? DONE_VISIBLE_SEC : getBubbleDoneSec(),
    fadeOutMs: FADE_OUT_MS,
    staleThresholdSec: isStage ? STALE_THRESHOLD_SEC : undefined,
    disableStale: isStage
      ? (disableStale ?? false) || (dismissed ?? false)
      : true,
  });

  const isActivePhase = ACTIVE_PHASES.has(
    phase as "processing" | "running_tool" | "compacting",
  );
  const isStale =
    isStage &&
    !disableStale &&
    isActivePhase &&
    now - lastActivity > STALE_THRESHOLD_SEC;
  const effectivePhase = isStage && dismissed && isStale ? "idle" : phase;

  return {
    isStage,
    visible,
    fading,
    fadeOutMs,
    effectivePhase,
  };
}
