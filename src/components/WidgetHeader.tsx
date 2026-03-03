import { css } from "@styled-system/css";
import { SessionState } from "@/lib/tauri";
import { BarView } from "@/components/BarView";
import { Button } from "@/components/Button";
import { ui } from "@/lib/glyph";

interface WidgetHeaderProps {
  onGearClick: () => void;
  onToggle: () => void;
  onCollapse: () => void;
  onBack?: () => void;
  expanded: boolean;
  settingsActive?: boolean;
  showBack?: boolean;
  sessions?: SessionState[];
  barHeight?: number;
}

const handleBar = css({
  h: "36px",
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  flexShrink: 0,
  cursor: "pointer",
  px: "6px",
  pt: "6px",
});

const handlePill = css({
  w: "40px",
  h: "4px",
  borderRadius: "2px",
  bg: "comment",
  opacity: 0.5,
});

const DEFAULT_BAR_HEIGHT = 48;

export function WidgetHeader({
  onGearClick,
  onToggle,
  onCollapse,
  onBack,
  expanded,
  settingsActive,
  showBack,
  sessions = [],
  barHeight = DEFAULT_BAR_HEIGHT,
}: WidgetHeaderProps) {
  if (expanded) {
    return (
      <div className={handleBar}>
        {showBack ? (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onBack?.();
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M8.5 3L4.5 7L8.5 11"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Button>
        ) : (
          <div className={css({ w: "24px" })} />
        )}
        <div
          className={css({
            cursor: "pointer",
            flex: 1,
            display: "flex",
            justifyContent: "center",
          })}
          onClick={onCollapse}
        >
          <div className={handlePill} />
        </div>
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onCollapse();
          }}
          style={{ fontSize: "14px",fontFamily:"SpaceMonoNerd" }}
        >
          {ui.minimize}
        </Button>
        <Button
          active={!!settingsActive}
          style={{ fontSize: "14px",fontFamily:"SpaceMonoNerd" }}
          onClick={(e) => {
            e.stopPropagation();
            onGearClick();
          }}
        >
          &#9881;
        </Button>
      </div>
    );
  }

  return (
    <BarView sessions={sessions} barHeight={barHeight} onToggle={onToggle} />
  );
}
