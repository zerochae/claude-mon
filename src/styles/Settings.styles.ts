import { css, cva } from "@styled-system/css";
import { MOTION } from "@/constants/motion";
import type {
  AppSettings,
  ThemeName,
  WindowAnchor,
  DockPosition,
} from "@/hooks/useSettings";
import {
  onedarkColors,
  nordColors,
  onelightColors,
  tokyonightColors,
  ayulightColors,
  ayudarkColors,
  gruvboxlightColors,
  gruvboxdarkColors,
  blossomlightColors,
  githublightColors,
  githubdarkColors,
} from "@/theme/colorscheme";

export const VIEW_WIDTH_ITEMS: {
  key: keyof AppSettings["viewWidths"];
  label: string;
}[] = [
  { key: "bar", label: "Bar Width" },
  { key: "stage", label: "Stage Width" },
  { key: "chat", label: "Chat Width" },
  { key: "settings", label: "Settings Width" },
];

export const THEMES: {
  name: ThemeName;
  label: string;
  colors: Record<string, string>;
}[] = [
  { name: "onedark", label: "One Dark", colors: onedarkColors },
  { name: "tokyonight", label: "Tokyo Night", colors: tokyonightColors },
  { name: "nord", label: "Nord", colors: nordColors },
  { name: "ayudark", label: "Ayu Dark", colors: ayudarkColors },
  { name: "gruvboxdark", label: "Gruvbox Dark", colors: gruvboxdarkColors },
  { name: "githubdark", label: "GitHub Dark", colors: githubdarkColors },
  { name: "onelight", label: "One Light", colors: onelightColors },
  { name: "ayulight", label: "Ayu Light", colors: ayulightColors },
  { name: "gruvboxlight", label: "Gruvbox Light", colors: gruvboxlightColors },
  { name: "blossomlight", label: "Blossom Light", colors: blossomlightColors },
  { name: "githublight", label: "GitHub Light", colors: githublightColors },
];

export const PREVIEW_KEYS = [
  "blue",
  "green",
  "red",
  "orange",
  "magenta",
  "cyan",
];

export const COLOR_OVERRIDE_KEYS = [
  { key: "bg", label: "BG" },
  { key: "text", label: "Text" },
  { key: "blue", label: "Blue" },
  { key: "green", label: "Green" },
  { key: "red", label: "Red" },
  { key: "yellow", label: "Yellow" },
  { key: "magenta", label: "Magenta" },
  { key: "cyan", label: "Cyan" },
  { key: "orange", label: "Orange" },
  { key: "comment", label: "Comment" },
];

export const ANCHOR_OPTIONS: { value: WindowAnchor; label: string }[] = [
  { value: "top", label: "Top" },
  { value: "center", label: "Center" },
  { value: "bottom", label: "Bot" },
];

export const VIBRANCY_OPTIONS = [
  { value: "none", label: "Off" },
  { value: "hud", label: "HUD" },
  { value: "popover", label: "Popover" },
  { value: "sidebar", label: "Sidebar" },
  { value: "menu", label: "Menu" },
  { value: "under_window", label: "Under Window" },
  { value: "window", label: "Window BG" },
  { value: "content", label: "Content BG" },
  { value: "header", label: "Header" },
  { value: "sheet", label: "Sheet" },
  { value: "titlebar", label: "Titlebar" },
  { value: "tooltip", label: "Tooltip" },
  { value: "fullscreen", label: "Fullscreen" },
];

export const DOCK_OPTIONS: { value: DockPosition; label: string }[] = [
  { value: "none", label: "Off" },
  { value: "top", label: "Top" },
  { value: "bottom", label: "Bot" },
];

export const columnsContainer = css({
  display: "flex",
  flex: 1,
  overflow: "hidden",
  animation: "fade-in 150ms cubic-bezier(0.2, 0, 0, 1)",
});

export const column = css({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  borderRight: "1px solid var(--colors-hairlineFaint, rgba(255,255,255,0.04))",
  _last: { borderRight: "none" },
});

export const columnHeader = css({
  fontSize: "10px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "textMuted",
  padding: "6px 10px",
  flexShrink: 0,
});

export const columnBody = css({
  flex: 1,
  overflowY: "auto",
});

export const rowStyle = css({
  display: "flex",
  alignItems: "center",
  padding: "5px 10px",
  gap: "6px",
  fontSize: "11px",
  color: "text",
});

export const rowLabel = css({
  flex: 1,
  fontSize: "11px",
  color: "text",
});

export const scrollInputStyle = css({
  width: "52px",
  fontSize: "10px",
  color: "text",
  background: "transparent",
  border: "1px solid var(--colors-comment, #565c64)",
  borderRadius: "4px",
  padding: "3px 6px",
  textAlign: "right",
  outline: "none",
  _focus: { borderColor: "var(--colors-blue, #61afef)" },
});

export const colorInput = css({
  width: "18px",
  height: "18px",
  padding: "0",
  border: "none",
  background: "transparent",
  cursor: "pointer",
  flexShrink: 0,
});

export const hexInput = css({
  width: "58px",
  fontSize: "10px",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  color: "text",
  background: "transparent",
  border: "1px solid var(--colors-comment, #565c64)",
  borderRadius: "4px",
  padding: "3px 4px",
  outline: "none",
  _focus: { borderColor: "var(--colors-blue, #61afef)" },
});

export const resetBtn = css({
  fontSize: "9px",
  color: "textMuted",
  cursor: "pointer",
  border: "none",
  background: "transparent",
  padding: "2px 4px",
  borderRadius: "3px",
  _hover: { bg: "surfaceHover", color: "text" },
});

export const anchorGroup = css({
  display: "flex",
  gap: "2px",
  borderRadius: "4px",
  overflow: "hidden",
  border: "1px solid var(--colors-comment, #565c64)",
});

export const anchorBtn = cva({
  base: {
    padding: "3px 8px",
    fontSize: "9px",
    border: "none",
    cursor: "pointer",
    color: "text",
    transition: "background 120ms ease",
    _hover: { bg: "surfaceHover" },
  },
  variants: {
    active: {
      true: { bg: "surfaceActive", fontWeight: 600 },
      false: { bg: "transparent", fontWeight: 400 },
    },
  },
  defaultVariants: { active: false },
});

export const selectStyle = css({
  fontSize: "10px",
  color: "text",
  background: "transparent",
  border: "1px solid var(--colors-comment, #565c64)",
  borderRadius: "4px",
  padding: "3px 6px",
  outline: "none",
  cursor: "pointer",
  _focus: { borderColor: "var(--colors-blue, #61afef)" },
});

export const toggleTrack = css({
  width: "28px",
  height: "16px",
  borderRadius: "8px",
  cursor: "pointer",
  position: "relative",
  transition: "background 120ms ease",
  flexShrink: 0,
});

export const toggleThumb = css({
  width: "12px",
  height: "12px",
  borderRadius: "50%",
  background: "white",
  position: "absolute",
  top: "2px",
  transition: "left 120ms ease",
});

export const themeButton = cva({
  base: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    w: "100%",
    padding: "5px 10px",
    border: "none",
    cursor: "pointer",
    transition: MOTION.transition.color,
    _hover: { bg: "surfaceHover" },
  },
  variants: {
    active: {
      true: { bg: "surfaceActive", _hover: { bg: "surfaceActive" } },
      false: { bg: "transparent" },
    },
  },
  defaultVariants: { active: false },
});

export const previewStrip = css({
  display: "flex",
  borderRadius: "3px",
  overflow: "hidden",
  flexShrink: 0,
});

export const themeOptLabel = cva({
  base: { flex: 1, textAlign: "left", color: "text", fontSize: "11px" },
  variants: {
    active: { true: { fontWeight: 600 }, false: { fontWeight: 400 } },
  },
  defaultVariants: { active: false },
});

export const checkMark = css({ color: "green", fontSize: "11px" });
