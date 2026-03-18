import { css, cva } from "@styled-system/css";

import { MOTION } from "@/constants/motion";

export const bottomPanel = css({
  flexShrink: 0,
  borderTop: "0.5px solid token(colors.hairline)",
  maxH: "45%",
  display: "flex",
  flexDirection: "column",
});

export const statusBar = css({
  padding: "5px 12px",
  color: "textMuted",
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
  color: "textMuted",
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

export const approvalRow = css({
  display: "flex",
  gap: "4px",
  flexShrink: 0,
});
