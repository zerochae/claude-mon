import { useState, useEffect, useMemo } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { MascotCanvas } from "@/components/MascotCanvas";
import { SessionState } from "@/lib/tauri";
import { getMascotColor } from "@/lib/colors";
import {
  useCrabBar,
  CRAB_BAR_WANDER_MS,
  CRAB_BAR_RUN_MS,
} from "@/hooks/useCrabBar";
import { BarBubble } from "@/components/BarBubble";
import { BAR_VISIBLE_PHASES, STALE_THRESHOLD_SEC } from "@/lib/phases";
import {
  BASE_BAR_HEIGHT,
  BASE_MASCOT_SIZE,
  collapsedBar,
  crabList,
  crabItem,
  sleepingWrap,
  zzzRow,
  zzz,
  zSmall,
  zMedium,
  zLarge,
} from "./BarView.styles";

interface BarViewProps {
  sessions: SessionState[];
  barHeight: number;
  onToggle: () => void;
}

export function BarView({ sessions, barHeight, onToggle }: BarViewProps) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const timer = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 5000);
    return () => clearInterval(timer);
  }, []);

  const activeSessions = useMemo(
    () =>
      sessions.filter(
        (s) =>
          s.phase !== "ended" &&
          (BAR_VISIBLE_PHASES.has(s.phase) || now - s.last_activity < STALE_THRESHOLD_SEC),
      ),
    [sessions, now],
  );

  const { positions, runningId, fadingIds, spawningIds, overflowIds, containerRef } =
    useCrabBar(activeSessions, barHeight);
  const hasSessions = activeSessions.length > 0;
  const unitScale = barHeight / BASE_BAR_HEIGHT;

  return (
    <div
      className={collapsedBar}
      style={{ height: barHeight }}
      onMouseDown={(e) => {
        if ((e.target as HTMLElement).closest(".no-drag")) return;
        getCurrentWindow()
          .startDragging()
          .catch(() => undefined);
      }}
      onClick={onToggle}
    >
      {hasSessions ? (
        <div ref={containerRef} className={crabList}>
          {activeSessions.map((s) => {
            const pos = positions[s.session_id] as
              | (typeof positions)[string]
              | undefined;
            if (!pos) return null;
            const isRunning = s.session_id === runningId;
            const isFading = fadingIds.has(s.session_id);
            const isOverflow = overflowIds.has(s.session_id);
            const isSpawning = spawningIds.has(s.session_id);

            return (
              <div
                key={s.session_id}
                className={crabItem}
                style={{
                  left: pos.x,
                  zIndex: isFading || isOverflow ? 0 : 1,
                  opacity: isFading || isOverflow ? 0 : 1,
                  transform: `scale(${unitScale})`,
                  transition: isRunning
                    ? `left ${CRAB_BAR_RUN_MS}ms ease-in-out, opacity 1.4s ease-out`
                    : `left ${CRAB_BAR_WANDER_MS}ms ease-in-out, opacity 1.4s ease-out`,
                  ...(isSpawning
                    ? {
                        animation:
                          "crab-drop 400ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                      }
                    : {}),
                }}
              >
                <div
                  style={
                    pos.facingRight ? undefined : { transform: "scaleX(-1)" }
                  }
                >
                  <MascotCanvas
                    color={getMascotColor(s.color_index)}
                    phase={isRunning ? "processing" : s.phase}
                    size={BASE_MASCOT_SIZE}
                  />
                </div>
                <BarBubble phase={s.phase} lastActivity={s.last_activity} />
              </div>
            );
          })}
        </div>
      ) : (
        <div className={sleepingWrap}>
          <div style={{ opacity: 0.5 }}>
            <MascotCanvas
              color="var(--colors-text, #abb2bf)"
              phase="idle"
              size={BASE_MASCOT_SIZE}
            />
          </div>
          <div className={zzzRow}>
            <span className={`${zzz} ${zSmall}`}>z</span>
            <span className={`${zzz} ${zMedium}`}>z</span>
            <span className={`${zzz} ${zLarge}`}>z</span>
          </div>
        </div>
      )}
    </div>
  );
}
