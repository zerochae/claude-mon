import { css } from "@styled-system/css";

interface GlyphProps {
  children: string;
  size?: number | string;
  color?: string;
  className?: string;
}

const base = css({
  fontFamily: "SpaceMonoNerd",
  lineHeight: 1,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
});

export function Glyph({ children, size = 12, color, className }: GlyphProps) {
  return (
    <span
      className={className ? `${base} ${className}` : base}
      style={{ fontSize: size, color }}
    >
      {children}
    </span>
  );
}
