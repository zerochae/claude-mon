import { type CSSProperties, memo } from "react";

import { Glyph } from "@/components/Glyph";
import { ui } from "@/constants/glyph";

type ChipSize = "sm" | "md";

const ICON_MAP: Record<string, { glyph: string; color: string }> = {
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

const SIZE_CONFIG: Record<ChipSize, { icon: number; gap: string }> = {
  sm: { icon: 13, gap: "2px" },
  md: { icon: 10, gap: "3px" },
};

interface InfoChipProps {
  icon: string;
  value: string | number;
  size?: ChipSize;
  color?: string;
  colorText?: boolean;
  style?: CSSProperties;
}

export const InfoChip = memo(function InfoChip({
  icon,
  value,
  size = "sm",
  color,
  colorText = false,
  style,
}: InfoChipProps) {
  const mapping = ICON_MAP[icon] as
    | { glyph: string; color: string }
    | undefined;
  if (!mapping) return null;
  const iconColor = color ?? mapping.color;
  const cfg = SIZE_CONFIG[size];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: cfg.gap,
        color: colorText ? iconColor : "var(--colors-text)",
        ...style,
      }}
    >
      <Glyph size={cfg.icon} color={iconColor}>
        {mapping.glyph}
      </Glyph>
      {value}
    </span>
  );
});
