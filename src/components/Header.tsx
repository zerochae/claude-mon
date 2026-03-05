import { css } from "@styled-system/css";
import { SessionState } from "@/services/tauri";
import { Bar } from "@/components/Bar";
import { Button } from "@/components/Button";
import { ui } from "@/constants/glyph";
import {
  DEFAULT_BAR_HEIGHT,
  handleBar,
  handlePill,
} from "./Header.styles";

interface HeaderProps {
  onGearClick: () => void;
  onToggle: () => void;
  onCollapse: () => void;
  onBack?: () => void;
  onSelectSession?: (session: SessionState) => void;
  expanded: boolean;
  settingsActive?: boolean;
  showBack?: boolean;
  sessions?: SessionState[];
  barHeight?: number;
}

export function Header({
  onGearClick,
  onToggle,
  onCollapse,
  onBack,
  onSelectSession,
  expanded,
  settingsActive,
  showBack,
  sessions = [],
  barHeight = DEFAULT_BAR_HEIGHT,
}: HeaderProps) {
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
          style={{ fontSize: "14px", fontFamily: "SpaceMonoNerd" }}
        >
          {ui.minimize}
        </Button>
        <Button
          active={!!settingsActive}
          style={{ fontSize: "14px", fontFamily: "SpaceMonoNerd" }}
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
    <Bar sessions={sessions} barHeight={barHeight} onToggle={onToggle} onSelectSession={onSelectSession} />
  );
}
