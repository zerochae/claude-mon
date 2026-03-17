import { css } from "@styled-system/css";

export const container = css({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  padding: "12px 16px",
  gap: "12px",
  overflowY: "auto",
  animation: "view-enter 200ms cubic-bezier(0.34, 1.56, 0.64, 1)",
});

export const clawdCenter = css({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  pt: "32px",
});

export const projectInfo = css({ textAlign: "center" });

export const projectName = css({
  color: "text",
  fontSize: "15px",
  fontWeight: 600,
  mb: "4px",
});

export const projectCwd = css({
  color: "textMuted",
  fontSize: "11px",
  wordBreak: "break-all",
});

export const infoCard = css({
  bg: "surfaceHover",
  border: "0.5px solid token(colors.hairline)",
  borderRadius: "8px",
  padding: "10px 12px",
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  shadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
});

export const infoRow = css({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
});

export const infoLabel = css({
  color: "textMuted",
  fontSize: "11px",
});

export const infoValue = css({
  color: "text",
  fontSize: "12px",
  fontWeight: 500,
});

export const toolBadge = css({
  fontSize: "11px",
  fontFamily: "inherit",
  bg: "surfaceOverlay",
  padding: "2px 6px",
  borderRadius: "4px",
});

export const pidValue = css({
  color: "gray",
  fontSize: "11px",
  fontFamily: "inherit",
});

export const approvalSection = css({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
});

export const toolInputBox = css({
  bg: "surfaceOverlay",
  border: "0.5px solid token(colors.hairline)",
  borderRadius: "8px",
  padding: "8px 10px",
  color: "gray",
  fontSize: "11px",
  fontFamily: "inherit",
  wordBreak: "break-all",
  maxH: "80px",
  overflowY: "auto",
});

export const usageSection = css({
  bg: "surfaceHover",
  border: "0.5px solid token(colors.hairline)",
  borderRadius: "8px",
  padding: "10px 12px",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  shadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
});

export const usageRow = css({
  display: "flex",
  flexDirection: "column",
  gap: "3px",
});

export const usageLabel = css({
  color: "textMuted",
  fontSize: "10px",
  fontWeight: 500,
});

export const usageBar = css({
  height: "4px",
  borderRadius: "2px",
  bg: "surfaceOverlay",
  overflow: "hidden",
});

export const usageFill = css({
  height: "100%",
  borderRadius: "2px",
  transition: "width 300ms ease",
});

export const usageText = css({
  color: "text",
  fontSize: "10px",
  fontWeight: 500,
});

export const usageMuted = css({
  color: "textMuted",
  fontSize: "9px",
});
