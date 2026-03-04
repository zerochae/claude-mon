import { css } from "@styled-system/css";

export const BASE_BAR_HEIGHT = 48;
export const BASE_MASCOT_SIZE = 22;

export const collapsedBar = css({
  display: "flex",
  alignItems: "flex-end",
  gap: "8px",
  px: "12px",
  pb: "4px",
  bg: "transparent",
  flexShrink: 0,
  cursor: "pointer",
});

export const crabList = css({
  pos: "relative",
  flex: 1,
  alignSelf: "stretch",
});

export const crabItem = css({
  pos: "absolute",
  bottom: 0,
  transformOrigin: "center bottom",
  display: "flex",
  alignItems: "center",
  gap: "4px",
});

export const sleepingWrap = css({
  display: "flex",
  alignItems: "flex-end",
  gap: "4px",
  flex: 1,
  justifyContent: "center",
  pb: "2px",
});

export const zzzRow = css({
  display: "flex",
  alignItems: "flex-end",
  gap: "1px",
  marginBottom: "8px",
});

export const zzz = css({
  color: "comment",
  fontWeight: 700,
  fontStyle: "italic",
  opacity: 0.6,
  animation: "zzz-float 2.5s ease-in-out infinite",
  lineHeight: 1,
});

export const zSmall = css({
  fontSize: "7px",
  animationDelay: "0s",
});

export const zMedium = css({
  fontSize: "9px",
  animationDelay: "0.4s",
});

export const zLarge = css({
  fontSize: "11px",
  animationDelay: "0.8s",
});
