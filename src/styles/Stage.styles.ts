import { css, cva } from "@styled-system/css";

export const CLAWD_SIZE = 20;
export const MINI_CLAWD_SIZE = 10;
export const LABEL_HEIGHT = 16;
export const BUBBLE_HEIGHT = 30;
export const SLOT_W = 70;
export const PAD_X = 10;
export const PAD_Y_TOP = BUBBLE_HEIGHT + 6;
export const PAD_Y_BOTTOM = LABEL_HEIGHT + 4;
export const HITBOX_X = CLAWD_SIZE + 20;
export const MINI_ROW_HEIGHT = MINI_CLAWD_SIZE + 4;
export const HITBOX_Y =
  CLAWD_SIZE + BUBBLE_HEIGHT + LABEL_HEIGHT + MINI_ROW_HEIGHT + 8;
export const WANDER_INTERVAL = 2200;

export const emptyState = css({
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "textMuted",
  fontSize: "13px",
});

export const outerContainer = css({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
});

export const canvas = css({
  flex: 1,
  pos: "relative",
  overflow: "hidden",
  backgroundImage:
    "radial-gradient(circle, token(colors.bg3) 0.6px, transparent 0.6px)",
  backgroundSize: "14px 14px",
});

export const clawdSlot = css({
  pos: "absolute",
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "2px",
});

export const spriteWrapper = cva({
  base: {},
  variants: {
    facing: {
      right: { transform: "scaleX(1)" },
      left: { transform: "scaleX(-1)" },
    },
    animation: {
      approval: { animation: "clawd-bounce 0.6s ease-in-out infinite" },
      input: { animation: "clawd-bounce 1.2s ease-in-out infinite" },
      none: {},
    },
  },
  defaultVariants: { facing: "right", animation: "none" },
});

export const clawdLabel = cva({
  base: {
    fontSize: "9px",
    textAlign: "center",
    whiteSpace: "nowrap",
    maxW: "70px",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  variants: {
    urgent: {
      true: { color: "red", fontWeight: 600 },
      false: { color: "textMuted", fontWeight: 400 },
    },
  },
  defaultVariants: { urgent: false },
});

export const clawdRow = css({
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
});

export const miniClawdRow = css({
  display: "flex",
  alignItems: "flex-end",
  gap: "1px",
});

export const miniClawdWrap = css({
  animation: "clawd-bounce 1.4s ease-in-out infinite",
});
