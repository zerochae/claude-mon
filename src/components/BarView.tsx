import { useState, useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { ClawdCanvas } from "@/components/ClawdCanvas";
import { SessionState } from "@/lib/tauri";
import { getClawdColor, COLOR_COUNT } from "@/lib/colors";
import {
  useClawdBar,
  CLAWD_BAR_WANDER_MS,
  CLAWD_BAR_RUN_MS,
} from "@/hooks/useClawdBar";
import { Bubble } from "@/components/Bubble";
import { BAR_VISIBLE_PHASES, STALE_THRESHOLD_SEC } from "@/lib/phases";
import {
  BASE_BAR_HEIGHT,
  BASE_CLAWD_SIZE,
  MINI_BAR_CLAWD_SIZE,
  collapsedBar,
  clawdList,
  clawdItem,
  miniBarRow,
  miniBarWrap,
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
  onSelectSession?: (session: SessionState) => void;
}

function filterActive(sessions: SessionState[]) {
  const now = Math.floor(Date.now() / 1000);
  return sessions.filter(
    (s) =>
      s.phase !== "ended" &&
      (BAR_VISIBLE_PHASES.has(s.phase) ||
        now - s.last_activity < STALE_THRESHOLD_SEC),
  );
}

function activeKey(sessions: SessionState[]) {
  return sessions.map((s) => `${s.session_id}:${s.phase}`).join();
}

export function BarView({ sessions, barHeight, onToggle, onSelectSession }: BarViewProps) {
  const [activeSessions, setActiveSessions] = useState(() =>
    filterActive(sessions),
  );

  useEffect(() => {
    const sync = () => {
      const next = filterActive(sessions);
      setActiveSessions((prev) =>
        activeKey(prev) === activeKey(next) ? prev : next,
      );
    };
    sync();
    const timer = setInterval(sync, 5000);
    return () => clearInterval(timer);
  }, [sessions]);

  const {
    positions,
    runningId,
    fadingIds,
    spawningIds,
    overflowIds,
    containerRef,
  } = useClawdBar(activeSessions, barHeight);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
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
                  zIndex: isFading || isOverflow ? 0 : hoveredId === s.session_id ? 10 : 1,
                  opacity: isFading || isOverflow ? 0 : 1,
                  transform: hoveredId === s.session_id
                    ? `scale(${unitScale * 1.25})`
                    : `scale(${unitScale})`,
                  filter: hoveredId === s.session_id
                    ? `drop-shadow(0 0 6px ${getClawdColor(s.color_index)}66)`
                    : undefined,
                  transition: isRunning
                    ? `left ${CLAWD_BAR_RUN_MS}ms ease-in-out, opacity 1.4s ease-out, transform 0.15s ease, filter 0.15s ease`
                    : `left ${CLAWD_BAR_WANDER_MS}ms ease-in-out, opacity 1.4s ease-out, transform 0.15s ease, filter 0.15s ease`,
                  ...(isSpawning
                    ? {
                        animation:
                          "clawd-drop 400ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                      }
                    : {}),
                }}
              >
                <div
                  style={
                    pos.facingRight ? undefined : { transform: "scaleX(-1)" }
                  }
                >
                  <ClawdCanvas
                    color={getClawdColor(s.color_index)}
                    phase={isRunning ? "processing" : s.phase}
                    size={BASE_CLAWD_SIZE}
                  />
                </div>
                <Bubble variant="bar" phase={s.phase} lastActivity={s.last_activity} />
                {s.subagent_count > 0 && (
                  <div className={miniBarRow}>
                    {Array.from({ length: Math.min(s.subagent_count, 3) }).map((_, i) => {
                      const miniPhases = ["processing", "compacting", "idle"] as const;
                      return (
                        <div
                          key={i}
                          className={miniBarWrap}
                          style={{
                            animationDelay: `${i * 0.2}s`,
                            transform: i % 2 === 0 ? "scaleX(1)" : "scaleX(-1)",
                          }}
                        >
                          <ClawdCanvas
                            color={getClawdColor((s.color_index + i + 3) % COLOR_COUNT)}
                            phase={miniPhases[i % miniPhases.length]}
                            size={MINI_BAR_CLAWD_SIZE}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className={sleepingWrap}>
          <div style={{ opacity: 0.5 }}>
            <ClawdCanvas
              color="var(--colors-text, #abb2bf)"
              phase="idle"
              size={BASE_CLAWD_SIZE}
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
