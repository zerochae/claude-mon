import { css, cva } from "@styled-system/css";

import { MOTION } from "@/constants/motion";

export const userBubbleWrap = css({
  display: "flex",
  justifyContent: "flex-end",
  px: "16px",
});

export const userBubble = css({
  bg: "bg4",
  color: "text",
  borderRadius: "12px 12px 4px 12px",
  padding: "0.4rem 0.65rem",
  maxW: "80%",
});

export const assistantWrap = css({
  px: "16px",
  bg: "surfaceOverlay",
  borderRadius: "8px",
  mx: "4px",
  py: "2px",
  "& p": {
    bg: "surfaceActive",
    borderRadius: "10px",
    padding: "0.35rem 0.6rem",
    maxW: "80%",
    w: "fit-content",
  },
});

export const toolWrap = css({ px: "16px" });

export const toolButton = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "5px",
  bg: "transparent",
  border: "none",
  cursor: "pointer",
  padding: "2px 4px",
  borderRadius: "4px",
  fontSize: "0.78rem",
  fontFamily: "inherit",
  color: "textMuted",
  transition: MOTION.transition.color,
  _hover: { color: "text", bg: "surfaceHover" },
  _active: { transform: "scale(0.97)" },
});

export const svgFlexShrink = css({ flexShrink: 0 });

export const chevron = cva({
  base: {
    transition: "transform 0.15s ease",
    opacity: 0.5,
  },
  variants: {
    expanded: {
      true: { transform: "rotate(90deg)" },
      false: { transform: "rotate(0deg)" },
    },
  },
  defaultVariants: { expanded: false },
});

export const toolExpanded = css({
  mt: "3px",
  pl: "0.5rem",
  borderLeft: "1px solid token(colors.hairline)",
});

export const messageGroup = cva({
  base: {
    display: "flex",
    flexDirection: "column",
  },
  variants: {
    role: {
      tool: { gap: "2px", pt: "4px", pb: "2px" },
      user: { gap: "6px", pt: "8px", pb: "4px" },
      assistant: { gap: "6px", pt: "4px", pb: "2px" },
    },
  },
});

export const subagentWrap = css({
  display: "flex",
  flexDirection: "column",
  px: "16px",
  py: "4px",
});

export const subagentClickable = css({
  display: "flex",
  alignItems: "center",
  gap: "6px",
  w: "100%",
  bg: "transparent",
  border: "none",
  cursor: "pointer",
  padding: 0,
  borderRadius: "8px",
  transition: "background 120ms ease",
  _hover: { bg: "surfaceHover" },
  _active: { bg: "surfaceHover", transform: "none" },
});

export const subagentPromptWrap = css({
  mt: "4px",
  ml: "22px",
  pl: "8px",
  borderLeft: "1px solid token(colors.hairline)",
  fontSize: "0.75rem",
  color: "textMuted",
  maxH: "200px",
  overflowY: "auto",
});

export const subagentBubble = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  bg: "surfaceOverlay",
  borderRadius: "10px",
  padding: "3px 10px 3px 4px",
  fontSize: "0.75rem",
  fontFamily: "inherit",
  color: "comment",
  overflow: "hidden",
  minWidth: 0,
  flex: 1,
});

export const subagentName = css({
  color: "text",
  fontWeight: 500,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
});

export const subagentDesc = css({
  color: "textMuted",
  fontSize: "0.7rem",
  maxW: "200px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const thinkingWrap = css({
  px: "16px",
  pt: "6px",
  pb: "4px",
});

export const chatHeader = css({
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  px: "12px",
  pt: "4px",
  pb: "6px",
  flexShrink: 0,
  borderBottom: "0.5px solid token(colors.hairline)",
});

export const chatHeaderLeft = css({
  display: "flex",
  alignItems: "flex-end",
  gap: "2px",
});

export const chatClawdWrap = css({
  cursor: "pointer",
  transition: "transform 150ms cubic-bezier(0.2, 0, 0, 1)",
  _hover: { transform: "scale(1.15)" },
  _active: { transform: "scale(0.95)" },
});

export const chatMiniRow = css({
  display: "flex",
  alignItems: "flex-end",
  gap: "1px",
  ml: "2px",
});

export const chatMiniWrap = css({
  animation: "clawd-bounce 2s ease-in-out infinite",
});

export const chatSleepingWrap = css({
  alignSelf: "center",
});

export const chatHeaderLabel = css({
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "3px",
  fontSize: "0.72rem",
  lineHeight: "14px",
  color: "textMuted",
  fontFamily: "inherit",
  overflow: "hidden",
  whiteSpace: "nowrap",
});

export const outerContainer = css({
  display: "flex",
  flexDirection: "column",
  flex: 1,
  overflow: "hidden",
});

export const scrollArea = css({
  flex: 1,
  overflowY: "auto",
  overflowX: "hidden",
  pt: "8px",
  pb: "8px",
  px: "4px",
  animation: "fade-in 150ms cubic-bezier(0.2, 0, 0, 1)",
});

export const inputBar = css({
  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: "6px 8px",
  borderTop: "0.5px solid token(colors.hairline)",
  bg: "transparent",
  flexShrink: 0,
});

export const loadingWrap = css({
  display: "flex",
  flex: 1,
  minHeight: "100%",
});

export const hasMoreIndicator = css({
  textAlign: "center",
  padding: "6px",
  fontSize: "10px",
  color: "var(--colors-textMuted, #848992)",
  opacity: 0.6,
});

export const pendingToolRow = css({
  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: "6px 12px",
  fontSize: "11px",
  color: "var(--colors-yellow)",
  cursor: "pointer",
  userSelect: "none",
});

export const pendingToolIcon = css({
  animation: "zzz-float 2s ease-in-out infinite",
});

export const pendingToolArrow = css({
  fontSize: "9px",
  opacity: 0.5,
});

export const errorBar = css({
  padding: "2px 8px",
  color: "var(--colors-red, #E06C75)",
  fontSize: "11px",
});

export const dividerDot = css({
  opacity: 0.3,
  margin: "0 3px",
});

export const gitDiffWrap = css({
  marginLeft: "4px",
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
});

export const chatInput = css({
  flex: 1,
  bg: "surfaceOverlay",
  border: "0.5px solid token(colors.hairline)",
  borderRadius: "6px",
  padding: "6px 10px",
  color: "text",
  fontSize: "12px",
  outline: "none",
  fontFamily: "inherit",
  transition:
    "border-color 120ms cubic-bezier(0.2, 0, 0, 1), box-shadow 120ms cubic-bezier(0.2, 0, 0, 1)",
  _focus: {
    borderColor: "rgba(97, 175, 239, 0.5)",
    shadow: "0 0 0 2px rgba(97, 175, 239, 0.15)",
  },
});
