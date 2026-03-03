import { css } from "@styled-system/css";
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

interface BarViewProps {
  sessions: SessionState[];
  barHeight: number;
  onToggle: () => void;
}

const collapsedBar = css({
  display: "flex",
  alignItems: "flex-end",
  gap: "8px",
  px: "12px",
  pb: "4px",
  bg: "transparent",
  flexShrink: 0,
  cursor: "pointer",
});

const crabList = css({
  pos: "relative",
  flex: 1,
  alignSelf: "stretch",
});

const crabItem = css({
  pos: "absolute",
  bottom: 0,
  transformOrigin: "center bottom",
  display: "flex",
  alignItems: "center",
  gap: "4px",
});

const sleepingWrap = css({
  display: "flex",
  alignItems: "flex-end",
  gap: "4px",
  flex: 1,
  justifyContent: "center",
  pb: "2px",
});

const zzzRow = css({
  display: "flex",
  alignItems: "flex-end",
  gap: "1px",
  marginBottom: "8px",
});

const zzz = css({
  color: "comment",
  fontWeight: 700,
  fontStyle: "italic",
  opacity: 0.6,
  animation: "zzz-float 2.5s ease-in-out infinite",
  lineHeight: 1,
});

const zSmall = css({
  fontSize: "7px",
  animationDelay: "0s",
});

const zMedium = css({
  fontSize: "9px",
  animationDelay: "0.4s",
});

const zLarge = css({
  fontSize: "11px",
  animationDelay: "0.8s",
});

const BASE_BAR_HEIGHT = 48;
const BASE_MASCOT_SIZE = 22;

export function BarView({ sessions, barHeight, onToggle }: BarViewProps) {
  const { positions, runningId, fadingIds, spawningIds, overflowIds, containerRef } =
    useCrabBar(sessions, barHeight);
  const hasSessions = sessions.length > 0;
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
          {sessions.map((s) => {
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
