import { useRef, useState } from "react";

import { useActivityDismissal } from "@/hooks/useActivityDismissal";
import { useClawdPositions } from "@/hooks/useClawdPositions";
import { SessionState } from "@/services/tauri";

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
