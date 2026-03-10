import { css } from "@styled-system/css";

export const card = css({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  padding: "10px 12px",
  borderBottom: "0.5px solid token(colors.hairline)",
  bg: "surfaceOverlay",
  flexShrink: 0,
  transformOrigin: "top center",
  animation: "card-enter 300ms cubic-bezier(0.34, 1.56, 0.64, 1) both",
});

export const header = css({
  display: "flex",
  alignItems: "center",
  gap: "6px",
});

export const toolLabel = css({
  fontSize: "11px",
  fontWeight: 600,
  color: "text",
});

export const badge = css({
  fontSize: "9px",
  fontWeight: 600,
  color: "orange",
  bg: "rgba(209, 154, 102, 0.15)",
  borderRadius: "4px",
  padding: "1px 5px",
  letterSpacing: "0.02em",
  lineHeight: 1.4,
});

export const summaryBox = css({
  bg: "bg",
  borderRadius: "4px",
  padding: "4px 6px",
  overflowY: "auto",
  border: "0.5px solid token(colors.hairline)",
  "& pre": { margin: 0, padding: 0, background: "transparent !important" },
  "& code": { fontSize: "11px !important" },
});

export const actions = css({
  display: "flex",
  gap: "6px",
});
