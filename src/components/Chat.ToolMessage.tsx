import { useState } from "react";
import { css } from "@styled-system/css";
import { Markdown } from "@/components/Markdown";
import { Glyph } from "@/components/Glyph";
import { ChatMessage } from "@/services/tauri";
import { getToolIcon, getToolColor, getToolLabel } from "@/constants/tools";

const wrap = css({
  px: "12px",
  pt: "4px",
  pb: "2px",
});

const toolHeader = css({
  display: "flex",
  alignItems: "center",
  gap: "2px",
  cursor: "pointer",
  padding: "3px 4px",
  borderRadius: "4px",
  fontSize: "0.78rem",
  lineHeight: 1,
  fontFamily: "inherit",
  color: "textMuted",
  transition: "color 120ms ease, background 120ms ease",
  _hover: { color: "text", bg: "surfaceHover" },
  _active: { transform: "scale(0.97)" },
});

const iconWrap = css({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  w: "16px",
  h: "16px",
  flexShrink: 0,
});

const contentWrap = css({
  mt: "3px",
  pl: "0.5rem",
  borderLeft: "1px solid token(colors.hairline)",
});

export function ToolMessage({ message }: { message: ChatMessage }) {
  const [expanded, setExpanded] = useState(true);
  const isRunning = message.tool_status === "running";
  const isError = message.tool_status === "error";

  const icon = getToolIcon(message.tool_name ?? null, message.content);
  const baseColor = getToolColor(message.tool_name ?? null, message.content);
  const label = getToolLabel(message.tool_name ?? null, message.content);

  const iconColor = isRunning
    ? "var(--colors-yellow, #e5c07b)"
    : isError
      ? "var(--colors-red, #E06C75)"
      : baseColor;

  return (
    <div className={wrap}>
      <div
        className={toolHeader}
        onClick={() => setExpanded(!expanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setExpanded(!expanded)}
        style={{ color: iconColor }}
      >
        <span
          className={iconWrap}
          style={
            isRunning
              ? { animation: "bubble-blink 1.5s ease-in-out infinite" }
              : undefined
          }
        >
          <Glyph size={14} color={iconColor}>
            {icon}
          </Glyph>
        </span>
        <span>{label}</span>
      </div>
      {expanded && (
        <div className={contentWrap}>
          <Markdown content={message.content} />
        </div>
      )}
    </div>
  );
}
