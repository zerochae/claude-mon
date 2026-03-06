import { useState } from "react";
import { css } from "@styled-system/css";
import { Button } from "@/components/Button";
import { Glyph } from "@/components/Glyph";
import { ShikiBlock } from "@/components/Markdown.ShikiBlock";
import { getToolIcon, getToolColor } from "@/constants/tools";

interface PermissionCardProps {
  toolName: string | null;
  toolInput: Record<string, unknown> | null;
  onAllow: () => void;
  onDeny: () => void;
}

function extractSummary(
  toolName: string | null,
  toolInput: Record<string, unknown> | null,
): { code: string; lang: string } | null {
  if (!toolInput) return null;
  if (toolName === "Bash" && typeof toolInput.command === "string")
    return { code: toolInput.command, lang: "bash" };
  if (toolName === "Edit" && typeof toolInput.file_path === "string") {
    const ext = toolInput.file_path.split(".").pop() ?? "";
    const langMap: Record<string, string> = {
      ts: "typescript",
      tsx: "tsx",
      js: "javascript",
      jsx: "jsx",
      rs: "rust",
      py: "python",
      css: "css",
      html: "html",
      json: "json",
      toml: "toml",
      yaml: "yaml",
      yml: "yaml",
      md: "markdown",
    };
    const lang = langMap[ext] ?? "plaintext";
    const parts = [toolInput.file_path];
    if (typeof toolInput.new_string === "string")
      parts.push(toolInput.new_string);
    return { code: parts.join("\n"), lang };
  }
  if (
    (toolName === "Read" || toolName === "Write") &&
    typeof toolInput.file_path === "string"
  )
    return { code: toolInput.file_path, lang: "plaintext" };
  if (toolName === "Glob" && typeof toolInput.pattern === "string")
    return { code: toolInput.pattern, lang: "plaintext" };
  if (toolName === "Grep" && typeof toolInput.pattern === "string")
    return { code: toolInput.pattern, lang: "regex" };
  if (toolName === "WebFetch" && typeof toolInput.url === "string")
    return { code: toolInput.url, lang: "plaintext" };
  return null;
}

const card = css({
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

const header = css({
  display: "flex",
  alignItems: "center",
  gap: "6px",
});

const toolLabel = css({
  fontSize: "11px",
  fontWeight: 600,
  color: "text",
});

const badge = css({
  fontSize: "9px",
  fontWeight: 600,
  color: "orange",
  bg: "rgba(209, 154, 102, 0.15)",
  borderRadius: "4px",
  padding: "1px 5px",
  letterSpacing: "0.02em",
  lineHeight: 1.4,
});

const summaryBox = css({
  bg: "bg",
  borderRadius: "4px",
  padding: "4px 6px",
  maxHeight: "100px",
  overflowY: "auto",
  border: "0.5px solid token(colors.hairline)",
  "& pre": { margin: 0, padding: 0, background: "transparent !important" },
  "& code": { fontSize: "11px !important" },
});

const detailToggle = css({
  fontSize: "10px",
  color: "textMuted",
  cursor: "pointer",
  bg: "transparent",
  border: "none",
  padding: 0,
  fontFamily: "inherit",
  _hover: { color: "text" },
});

const detailBox = css({
  fontSize: "10px",
  fontFamily: "inherit",
  color: "textMuted",
  maxHeight: "120px",
  overflowY: "auto",
  lineHeight: 1.5,
});

const actions = css({
  display: "flex",
  gap: "6px",
});

export function PermissionCard({
  toolName,
  toolInput,
  onAllow,
  onDeny,
}: PermissionCardProps) {
  const [showDetail, setShowDetail] = useState(false);
  const icon = getToolIcon(toolName);
  const iconColor = getToolColor(toolName);
  const summary = extractSummary(toolName, toolInput);
  const summaryKeys = new Set(["command", "file_path", "pattern", "url"]);
  const extraEntries = toolInput
    ? Object.entries(toolInput).filter(([k]) => !summaryKeys.has(k))
    : [];
  const hasExtra = extraEntries.length > 0;

  return (
    <div className={card}>
      <div className={header}>
        <Glyph size={13} color={iconColor}>
          {icon}
        </Glyph>
        <span className={toolLabel}>{toolName ?? "Unknown"}</span>
        <span className={badge}>PERMISSION</span>
      </div>

      {summary && (
        <div className={summaryBox}>
          <ShikiBlock code={summary.code} lang={summary.lang} />
        </div>
      )}

      {hasExtra && (
        <>
          <button
            className={detailToggle}
            onClick={() => setShowDetail((p) => !p)}
          >
            {showDetail ? "Hide details" : "Show details"}
          </button>
          {showDetail && (
            <div className={detailBox}>
              {extraEntries.map(([k, v]) => (
                <div key={k}>
                  <span style={{ color: "var(--colors-blue, #61AFEF)" }}>
                    {k}
                  </span>
                  :{" "}
                  {typeof v === "string" ? v : JSON.stringify(v, null, 2)}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div className={actions}>
        <Button variant="outline" size="sm" onClick={onDeny} style={{ flex: 1 }}>
          Deny
        </Button>
        <Button
          variant="solid"
          size="sm"
          color="success"
          onClick={onAllow}
          style={{ flex: 1 }}
        >
          Allow
        </Button>
      </div>
    </div>
  );
}
