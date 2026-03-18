import { css } from "@styled-system/css";
import { type CSSProperties, memo, useState } from "react";

import { GitDiffBlock } from "@/components/Chat.GitDiffBlock";
import { Glyph } from "@/components/Glyph";
import { Markdown } from "@/components/Markdown";
import { extensions, NERD, ui } from "@/constants/glyph";
import {
  detectBashSubtype,
  extractFilename,
  getToolColor,
  getToolIcon,
  getToolLabel,
} from "@/constants/tools";
import { ChatMessage } from "@/services/tauri";
import { ansiToHtml, hasAnsi } from "@/utils/ansi";
import { highlightGitOutput } from "@/utils/gitHighlight";

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
  locked,
}: {
  message: ChatMessage;
  locked?: boolean;
}) {
  const isAgent = message.tool_name === "Agent" || message.tool_name === "Task";
  const defaultOpen = message.tool_name !== "Read";
  const [expanded, setExpanded] = useState(locked ?? defaultOpen);
  const toggle = locked ? undefined : () => setExpanded(!expanded);
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
        onClick={toggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && toggle?.()}
        style={{ color: iconColor }}
      >
        {message.tool_name === "Read" ? (
          <ReadLabel
            content={message.content}
            color={iconColor}
            isRunning={isRunning}
            expanded={expanded}
          />
        ) : (
          <>
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
          </>
        )}
        {message.tool_name !== "Read" && (
          <span style={arrowStyle}>{expanded ? "▼" : "▶"}</span>
        )}
      </div>
      {expanded && !isAgent && (
        <div className={contentWrap}>
          <Markdown content={message.content} />
          {message.tool_output && (
            <div className={outputWrap}>
              {(() => {
                if (hasAnsi(message.tool_output)) {
                  return (
                    <pre
                      className={ansiPre}
                      dangerouslySetInnerHTML={{
                        __html: ansiToHtml(message.tool_output),
                      }}
                    />
                  );
                }
                const isGitBash =
                  message.tool_name === "Bash" &&
                  detectBashSubtype(message.content) === "git";
                if (isGitBash && message.tool_output.includes("diff --git")) {
                  return <GitDiffBlock output={message.tool_output} />;
                }
                const gitHtml = highlightGitOutput(
                  message.content,
                  message.tool_output,
                );
                if (gitHtml) {
                  return (
                    <pre
                      className={ansiPre}
                      dangerouslySetInnerHTML={{ __html: gitHtml }}
                    />
                  );
                }
                return <pre className={ansiPre}>{message.tool_output}</pre>;
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

const readLabelStyle: CSSProperties = { fontSize: "0.72rem", opacity: 0.6 };
const readFilenameStyle: CSSProperties = {
  color: "var(--colors-text, #abb2bf)",
};
const arrowStyle: CSSProperties = {
  fontSize: "8px",
  opacity: 0.5,
  marginLeft: "2px",
};
const readExtStyle: CSSProperties = {
  fontFamily: NERD,
  fontSize: "0.85rem",
  marginRight: "4px",
};

const extMap = extensions as Record<
  string,
  { icon: string; color: string; name: string } | undefined
>;

function getExtInfo(filename: string) {
  const dotIdx = filename.lastIndexOf(".");
  if (dotIdx < 0) return extMap[filename];
  return extMap[filename.slice(dotIdx + 1)];
}

function ReadLabel({
  content,
  color,
  isRunning,
  expanded,
}: {
  content: string;
  color: string;
  isRunning: boolean;
  expanded: boolean;
}) {
  const filename = extractFilename(content);
  const ext = filename ? getExtInfo(filename) : undefined;
  const anim = isRunning
    ? { animation: "bubble-blink 1.5s ease-in-out infinite" }
    : undefined;

  return (
    <>
      <span className={iconWrap} style={anim}>
        <Glyph size={14} color={color}>
          {ui.eye}
        </Glyph>
      </span>
      <span style={readLabelStyle}>Read: </span>
      {ext && (
        <span style={{ ...readExtStyle, color: ext.color }}>{ext.icon}</span>
      )}
      {filename && <span style={readFilenameStyle}>{filename}</span>}
      <span style={arrowStyle}>{expanded ? "▼" : "▶"}</span>
    </>
  );
}
