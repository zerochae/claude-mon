import { ui } from "@/constants/glyph";

export type ChipSize = "sm" | "md";

export const ICON_MAP: Record<string, { glyph: string; color: string }> = {
  model: { glyph: ui.agent, color: "var(--colors-blue)" },
  project: { glyph: ui.project, color: "var(--colors-blue)" },
  folder: { glyph: ui.folder_close, color: "var(--colors-red)" },
  path: { glyph: ui.folder_close, color: "var(--colors-comment)" },
  branch: { glyph: ui.gitBranch, color: "var(--colors-magenta)" },
  plan: { glyph: ui.tag, color: "var(--colors-green)" },
  messages: { glyph: ui.bubble_waiting_for_input, color: "var(--colors-cyan)" },
  token: { glyph: ui.token, color: "var(--colors-yellow)" },
  cache: { glyph: ui.copy, color: "var(--colors-orange)" },
  git_add: { glyph: ui.git_add, color: "var(--colors-green)" },
  git_change: { glyph: ui.git_change, color: "var(--colors-orange)" },
  git_remove: { glyph: ui.git_remove, color: "var(--colors-red)" },
};

export const SIZE_CONFIG: Record<ChipSize, { icon: number; gap: string }> = {
  sm: { icon: 13, gap: "2px" },
  md: { icon: 10, gap: "3px" },
};
