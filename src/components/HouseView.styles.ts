import { css, cva } from "@styled-system/css";
import { MOTION } from "@/lib/motion";

export const MASCOT_SIZE = 20;
export const LABEL_HEIGHT = 16;
export const BUBBLE_HEIGHT = 30;
export const SLOT_W = 70;
export const PAD_X = 10;
export const PAD_Y_TOP = BUBBLE_HEIGHT + 6;
export const PAD_Y_BOTTOM = LABEL_HEIGHT + 4;
export const HITBOX_X = MASCOT_SIZE + 20;
export const HITBOX_Y = MASCOT_SIZE + BUBBLE_HEIGHT + LABEL_HEIGHT + 8;
export const WANDER_INTERVAL = 2200;

export const emptyState = css({
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "comment",
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

export const mascotSlot = css({
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
      approval: { animation: "mascot-bounce 0.6s ease-in-out infinite" },
      input: { animation: "mascot-bounce 1.2s ease-in-out infinite" },
      none: {},
    },
  },
  defaultVariants: { facing: "right", animation: "none" },
});

export const mascotLabel = cva({
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
      false: { color: "comment", fontWeight: 400 },
    },
  },
  defaultVariants: { urgent: false },
});

export const bottomPanel = css({
  flexShrink: 0,
  borderTop: "0.5px solid token(colors.hairline)",
  maxH: "45%",
  display: "flex",
  flexDirection: "column",
});

export const statusBar = css({
  padding: "5px 12px",
  color: "comment",
  fontSize: "10px",
  display: "flex",
  gap: "6px",
  borderBottom: "0.5px solid token(colors.hairlineFaint)",
  bg: "transparent",
});

export const sessionListScroll = css({
  overflowY: "auto",
  flex: 1,
});

export const sessionItem = css({
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "6px 12px",
  cursor: "pointer",
  borderBottom: "0.5px solid token(colors.hairlineFaint)",
  transition: MOTION.transition.color,
  _hover: { bg: "surfaceHover" },
  _active: { bg: "surfaceActive" },
});

export const priorityDot = cva({
  base: {
    w: "6px",
    h: "6px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  variants: {
    urgent: {
      true: {
        bg: "red",
        shadow: "0 0 3px token(colors.red), 0 0 8px rgba(224, 108, 117, 0.3)",
      },
      false: {},
    },
  },
  defaultVariants: { urgent: false },
});

export const sessionContent = css({ flex: 1, minW: 0 });

export const sessionName = css({
  color: "text",
  fontSize: "11px",
  fontWeight: 500,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
});

export const sessionPhase = css({
  color: "comment",
  fontSize: "9px",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
});

export const actionButtons = css({
  display: "flex",
  gap: "4px",
  flexShrink: 0,
});
