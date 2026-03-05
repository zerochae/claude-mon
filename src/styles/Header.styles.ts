import { css } from "@styled-system/css";

export const DEFAULT_BAR_HEIGHT = 48;

export const handleBar = css({
  h: "36px",
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  flexShrink: 0,
  cursor: "pointer",
  px: "6px",
  pt: "6px",
});

export const handlePill = css({
  w: "40px",
  h: "4px",
  borderRadius: "2px",
  bg: "comment",
  opacity: 0.5,
});
