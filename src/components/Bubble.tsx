import { memo } from "react";
import { ProcessingSpinner, CompactingDots } from "@/components/Spinners";
import { phaseText, wrapper, bubble, tailStyle } from "@/styles/Bubble.styles";
import { ui } from "@/constants/glyph";
import { useBubble } from "@/hooks/useBubble";

type BubbleVariant = "bar" | "chat" | "stage";
type BubbleSize = "lg" | "md" | "sm";

const VARIANT_SIZE: Record<BubbleVariant, BubbleSize> = {
  bar: "lg",
  chat: "sm",
  stage: "md",
};

interface BubbleProps {
  variant: BubbleVariant;
  phase: string;
  lastActivity: number;
  dismissed?: boolean;
  disableStale?: boolean;
}

export const Bubble = memo(function Bubble({
  variant,
  phase,
  lastActivity,
  dismissed,
  disableStale,
}: BubbleProps) {
  const { isStage, visible, fading, fadeOutMs, effectivePhase } = useBubble({
    variant,
    phase,
    lastActivity,
    dismissed,
    disableStale,
  });

  if (phase === "ended" || !visible) return null;

  const size = VARIANT_SIZE[variant];
  let content: React.ReactNode;

  switch (effectivePhase) {
    case "processing":
    case "running_tool":
      content = (
        <ProcessingSpinner
          className={phaseText({ phase: "processing", size })}
        />
      );
      break;
    case "compacting":
      content = (
        <CompactingDots className={phaseText({ phase: "compacting", size })} />
      );
      break;
    case "waiting_for_approval":
      content = (
        <span className={phaseText({ phase: "approval", size })}>
          {ui.bubble_waiting_for_approval}
        </span>
      );
      break;
    case "waiting_for_input":
      content = (
        <span className={phaseText({ phase: "input", size })}>
          {ui.bubble_waiting_for_input}
        </span>
      );
      break;
    case "idle":
      content = <span className={phaseText({ phase: "idle", size })}></span>;
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
            : effectivePhase === "idle" || effectivePhase === "waiting_for_input"
              ? { animation: "scale-in 400ms cubic-bezier(0.34, 1.56, 0.64, 1)" }
              : undefined
        }
      >
        {content}
        {isStage && <div className={tailStyle} />}
      </div>
    </div>
  );
});
