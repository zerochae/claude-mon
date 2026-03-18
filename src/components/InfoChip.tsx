import { type CSSProperties, memo } from "react";

import { Glyph } from "@/components/Glyph";
import { type ChipSize, ICON_MAP, SIZE_CONFIG } from "@/constants/infoChip";

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
