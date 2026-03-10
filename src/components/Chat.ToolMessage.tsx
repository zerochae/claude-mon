import { memo, useState } from "react";
import { css } from "@styled-system/css";
import { Markdown } from "@/components/Markdown";
import { Glyph } from "@/components/Glyph";
import { ChatMessage } from "@/services/tauri";
import { getToolIcon, getToolColor, getToolLabel } from "@/constants/tools";
import { ansiToHtml, hasAnsi } from "@/utils/ansi";

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

const outputWrap = css({
  mt: "4px",
  borderTop: "1px solid token(colors.hairline)",
  pt: "4px",
});

const ansiPre = css({
  fontFamily:
    "'SpaceMonoNerd', 'JetBrainsMono Nerd Font Mono', 'FiraCode Nerd Font', monospace",
  fontSize: "0.75rem",
  lineHeight: 1.4,
  whiteSpace: "pre",
  m: 0,
  p: "6px 8px",
  color: "text",
  bg: "rgba(0,0,0,0.2)",
  borderRadius: "4px",
  maxHeight: "300px",
  overflowX: "auto",
  overflowY: "auto",
});

export const ToolMessage = memo(function ToolMessage({
  message,
}: {
  message: ChatMessage;
}) {
  const defaultOpen = message.tool_name !== "Read";
  const [expanded, setExpanded] = useState(defaultOpen);
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
        onKeyDown={(e) =>
          (e.key === "Enter" || e.key === " ") && setExpanded(!expanded)
        }
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
        <span style={{ fontSize: "8px", opacity: 0.5, marginLeft: "2px" }}>
          {expanded ? "▼" : "▶"}
        </span>
      </div>
      {expanded && (
        <div className={contentWrap}>
          <Markdown content={message.content} />
          {message.tool_output && (
            <div className={outputWrap}>
              {hasAnsi(message.tool_output) ? (
                <pre
                  className={ansiPre}
                  dangerouslySetInnerHTML={{
                    __html: ansiToHtml(message.tool_output),
                  }}
                />
              ) : (
                <pre className={ansiPre}>{message.tool_output}</pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
