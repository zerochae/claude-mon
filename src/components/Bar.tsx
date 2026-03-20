import { getCurrentWindow } from "@tauri-apps/api/window";
import { memo } from "react";

import { Bubble } from "@/components/Bubble";
import { Clawd } from "@/components/Clawd";
import { SleepingZzz } from "@/components/SleepingZzz";
import { COLOR_COUNT, getClawdColor } from "@/constants/colors";
import { useBar } from "@/hooks/useBar";
import { CLAWD_BAR_RUN_MS, CLAWD_BAR_WANDER_MS } from "@/hooks/useClawdBar";
import { SessionState } from "@/services/tauri";
import {
  BASE_BAR_HEIGHT,
  BASE_CLAWD_SIZE,
  clawdItem,
  clawdList,
  collapsedBar,
  MINI_BAR_CLAWD_SIZE,
  miniBarRow,
  miniBarWrap,
  sleepingWrap,
} from "@/styles/Bar.styles";

interface BarProps {
  sessions: SessionState[];
  barHeight: number;
  onToggle: () => void;
  onSelectSession?: (session: SessionState) => void;
}

export const Bar = memo(function Bar({
  sessions,
  barHeight,
  onToggle,
  onSelectSession,
}: BarProps) {
  const {
    activeSessions,
    positions,
    runningId,
    fadingIds,
    spawningIds,
    overflowIds,
    containerRef,
    hoveredId,
    setHoveredId,
    hasSessions,
    lastColorIndex,
  } = useBar(sessions, barHeight);

  const scale = barHeight / BASE_BAR_HEIGHT;
  const clawdSize = Math.round(BASE_CLAWD_SIZE * scale);
  const miniSize = Math.round(MINI_BAR_CLAWD_SIZE * scale);

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
        <div ref={containerRef} className={clawdList}>
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
                className={`${clawdItem} no-drag`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectSession?.(s);
                }}
                onMouseEnter={() => setHoveredId(s.session_id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  left: pos.x,
                  cursor: "pointer",
                  zIndex:
                    isFading || isOverflow
                      ? 0
                      : hoveredId === s.session_id
                        ? 10
                        : 1,
                  opacity: isFading || isOverflow ? 0 : 1,
                  transform:
                    hoveredId === s.session_id ? "scale(1.25)" : undefined,
                  filter:
                    hoveredId === s.session_id
                      ? `drop-shadow(0 0 6px ${getClawdColor(s.color_index)}66)`
                      : undefined,
                  transition: isRunning
                    ? `left ${CLAWD_BAR_RUN_MS}ms ease-in-out, opacity 1.4s ease-out, transform 0.15s ease, filter 0.15s ease`
                    : `left ${CLAWD_BAR_WANDER_MS}ms ease-in-out, opacity 1.4s ease-out, transform 0.15s ease, filter 0.15s ease`,
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
                  <Clawd
                    color={getClawdColor(s.color_index)}
                    phase={isRunning ? "processing" : s.phase}
                    size={clawdSize}
                  />
                </div>
                <Bubble
                  variant="bar"
                  phase={s.phase}
                  lastActivity={s.last_activity}
                  scale={scale}
                />
                {s.subagent_count > 0 && (
                  <div className={miniBarRow}>
                    {Array.from({ length: Math.min(s.subagent_count, 3) }).map(
                      (_, i) => {
                        const miniPhases = [
                          "processing",
                          "compacting",
                          "idle",
                        ] as const;
                        return (
                          <div
                            key={i}
                            className={miniBarWrap}
                            style={{
                              animationDelay: `${i * 0.2}s`,
                              transform:
                                i % 2 === 0 ? "scaleX(1)" : "scaleX(-1)",
                            }}
                          >
                            <Clawd
                              color={getClawdColor(
                                (s.color_index + i + 3) % COLOR_COUNT,
                              )}
                              phase={miniPhases[i % miniPhases.length]}
                              size={miniSize}
                            />
                          </div>
                        );
                      },
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className={sleepingWrap}>
          <div>
            <Clawd
              color={getClawdColor(lastColorIndex)}
              phase="idle"
              size={clawdSize}
            />
          </div>
          <SleepingZzz />
        </div>
      )}
    </div>
  );
});
