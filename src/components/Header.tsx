import { memo } from "react";
import { css } from "@styled-system/css";
import { Button } from "@/components/Button";
import { Glyph } from "@/components/Glyph";
import { ui } from "@/constants/glyph";
import { handleBar, handlePill } from "@/styles/Header.styles";

interface ExpandedHeaderProps {
  onGearClick: () => void;
  onCollapse: () => void;
  onBack?: () => void;
  settingsActive?: boolean;
  showBack?: boolean;
}

export const ExpandedHeader = memo(function ExpandedHeader({
  onGearClick,
  onCollapse,
  onBack,
  settingsActive,
  showBack,
}: ExpandedHeaderProps) {
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
      >
        <Glyph size={14}>{ui.minimize}</Glyph>
      </Button>
      <Button
        active={!!settingsActive}
        onClick={(e) => {
          e.stopPropagation();
          onGearClick();
        }}
      >
        <Glyph size={14}>&#9881;</Glyph>
      </Button>
    </div>
  );
});
