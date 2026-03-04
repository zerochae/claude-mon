import { useState, useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { ClawdCanvas } from "@/components/ClawdCanvas";
import { SessionState } from "@/lib/tauri";
import { getClawdColor } from "@/lib/colors";
import {
  useClawdBar,
  CLAWD_BAR_WANDER_MS,
  CLAWD_BAR_RUN_MS,
} from "@/hooks/useClawdBar";
import { BarBubble } from "@/components/BarBubble";
import { BAR_VISIBLE_PHASES, STALE_THRESHOLD_SEC } from "@/lib/phases";
import {
  BASE_BAR_HEIGHT,
  BASE_CLAWD_SIZE,
  collapsedBar,
  clawdList,
  clawdItem,
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

function filterActive(sessions: SessionState[]) {
  const now = Math.floor(Date.now() / 1000);
  return sessions.filter(
    (s) =>
      s.phase !== "ended" &&
      (BAR_VISIBLE_PHASES.has(s.phase) || now - s.last_activity < STALE_THRESHOLD_SEC),
  );
}

function activeKey(sessions: SessionState[]) {
  return sessions.map((s) => `${s.session_id}:${s.phase}`).join();
}

export function BarView({ sessions, barHeight, onToggle }: BarViewProps) {
  const [activeSessions, setActiveSessions] = useState(() => filterActive(sessions));

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

  const { positions, runningId, fadingIds, spawningIds, overflowIds, containerRef } =
    useClawdBar(activeSessions, barHeight);
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
                className={clawdItem}
                style={{
                  left: pos.x,
                  zIndex: isFading || isOverflow ? 0 : 1,
                  opacity: isFading || isOverflow ? 0 : 1,
                  transform: `scale(${unitScale})`,
                  transition: isRunning
                    ? `left ${CLAWD_BAR_RUN_MS}ms ease-in-out, opacity 1.4s ease-out`
                    : `left ${CLAWD_BAR_WANDER_MS}ms ease-in-out, opacity 1.4s ease-out`,
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
                <BarBubble phase={s.phase} lastActivity={s.last_activity} />
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
