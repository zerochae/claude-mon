import { useState, useRef } from "react";
import { SessionState } from "@/services/tauri";
import { useClawdPositions } from "@/hooks/useClawdPositions";
import { useActivityDismissal } from "@/hooks/useActivityDismissal";

export function useStage(sessions: SessionState[]) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const positions = useClawdPositions(sessions, containerRef);
  const { dismissedIds, dismiss } = useActivityDismissal(sessions);

  return {
    containerRef,
    hoveredId,
    setHoveredId,
    positions,
    dismissedIds,
    dismiss,
  };
}
