import { memo } from "react";
import { css } from "@styled-system/css";
import { Button } from "@/components/Button";
import { Glyph } from "@/components/Glyph";
import { ShikiBlock } from "@/components/Markdown.ShikiBlock";
import { DiffBlock } from "@/components/Markdown.DiffBlock";
import { getToolIcon, getToolColor } from "@/constants/tools";
import { getClawdColor } from "@/constants/colors";
import { extensions as extGlyphs } from "@/constants/glyph";
import { Clawd } from "@/components/Clawd";

interface PermissionCardProps {
  toolName: string | null;
  toolInput: Record<string, unknown> | null;
  projectName?: string;
  cwd?: string;
  colorIndex?: number;
  phase?: string;
  hideIdentity?: boolean;
  onAllow: () => void;
  onDeny: () => void;
}

function formatBashCommand(raw: string): string {
  const heredocRe = /\$\(cat\s*<<'?(\w+)'?\n([\s\S]*?)\n\s*\1\s*\)/g;
  let result = raw.replace(heredocRe, (_, _tag, body: string) => {
    const lines = body.split("\n");
    const leadingWs = /^\s*/;
    const minIndent = lines
      .filter((l) => l.trim())
      .reduce(
        (min, l) => Math.min(min, leadingWs.exec(l)?.[0].length ?? 0),
        Infinity,
      );
    const dedented = lines.map((l) => l.slice(minIndent)).join("\n");
    return `\n${dedented}`;
  });

  result = result.replace(/\s*&&\s*/g, "\n");

  return result.trim();
}

function simpleDiff(oldLines: string[], newLines: string[]): string[] {
  const n = oldLines.length;
  const m = newLines.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    Array<number>(m + 1).fill(0),
  );
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++)
      dp[i][j] =
        oldLines[i - 1] === newLines[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);

  const result: string[] = [];
  let i = n,
    j = m;
  const stack: string[] = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      stack.push(`  ${oldLines[i - 1]}`);
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push(`+ ${newLines[j - 1]}`);
      j--;
    } else {
      stack.push(`- ${oldLines[i - 1]}`);
      i--;
    }
  }
  while (stack.length) {
    const line = stack.pop();
    if (line !== undefined) result.push(line);
  }
  return result;
}

type SummaryResult = { code: string; lang: string; diff?: boolean } | null;

const EXT_LANG: Record<string, string> = {
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

function extractSummary(
  toolName: string | null,
  toolInput: Record<string, unknown> | null,
): SummaryResult {
  if (!toolInput) return null;
  if (toolName === "Bash" && typeof toolInput.command === "string")
    return { code: formatBashCommand(toolInput.command), lang: "bash" };
  if (toolName === "Edit" && typeof toolInput.file_path === "string") {
    const ext = toolInput.file_path.split(".").pop() ?? "";
    const lang = EXT_LANG[ext] ?? "plaintext";
    const oldStr =
      typeof toolInput.old_string === "string" ? toolInput.old_string : "";
    const newStr =
      typeof toolInput.new_string === "string" ? toolInput.new_string : "";
    const oldLines = oldStr.split("\n");
    const newLines = newStr.split("\n");
    const diffLines = simpleDiff(oldLines, newLines);
    return { code: diffLines.join("\n"), lang, diff: true };
  }
  if (toolName === "Write" && typeof toolInput.file_path === "string") {
    const ext = toolInput.file_path.split(".").pop() ?? "";
    const lang = EXT_LANG[ext] ?? "plaintext";
    const content =
      typeof toolInput.content === "string" ? toolInput.content : "";
    return { code: content || toolInput.file_path, lang };
  }
  if (toolName === "Read" && typeof toolInput.file_path === "string")
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
  overflowY: "auto",
  border: "0.5px solid token(colors.hairline)",
  "& pre": { margin: 0, padding: 0, background: "transparent !important" },
  "& code": { fontSize: "11px !important" },
});

const actions = css({
  display: "flex",
  gap: "6px",
});

export const PermissionCard = memo(function PermissionCard({
  toolName,
  toolInput,
  projectName,
  cwd,
  colorIndex = 0,
  phase = "idle",
  hideIdentity = false,
  onAllow,
  onDeny,
}: PermissionCardProps) {
  const icon = getToolIcon(toolName);
  const iconColor = getToolColor(toolName);
  const summary = extractSummary(toolName, toolInput);
  const description = toolInput?.description as string | undefined;
  const filePath = toolInput?.file_path as string | undefined;
  const displayPath =
    filePath && cwd && filePath.startsWith(cwd)
      ? filePath.slice(cwd.endsWith("/") ? cwd.length : cwd.length + 1)
      : filePath;

  return (
    <div className={card}>
      {!hideIdentity && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Clawd color={getClawdColor(colorIndex)} phase={phase} size={16} />
          {projectName && (
            <span
              style={{
                fontSize: "10px",
                color: "var(--colors-text-muted)",
                fontWeight: 500,
              }}
            >
              {projectName}
            </span>
          )}
        </div>
      )}
      <div className={header}>
        <Glyph size={13} color={iconColor}>
          {icon}
        </Glyph>
        <span className={toolLabel}>{toolName ?? "Unknown"}</span>
        <span className={badge}>PERMISSION</span>
        {filePath && displayPath && (
          <span
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: "3px",
              fontSize: "10px",
              fontWeight: 400,
            }}
          >
            <Glyph
              size={10}
              color={
                (
                  extGlyphs[
                    filePath.split(".").pop() as keyof typeof extGlyphs
                  ] as { color: string } | undefined
                )?.color ?? "var(--colors-text-muted)"
              }
            >
              {(
                extGlyphs[
                  filePath.split(".").pop() as keyof typeof extGlyphs
                ] as { icon: string } | undefined
              )?.icon ?? "\uf15b"}
            </Glyph>
            <span style={{ lineHeight: 1, color: "var(--colors-text-muted)" }}>
              {displayPath}
            </span>
          </span>
        )}
      </div>

      {description && (
        <span
          style={{
            fontSize: "10px",
            color: "var(--colors-text-muted)",
            lineHeight: 1.4,
          }}
        >
          {description}
        </span>
      )}

      {summary && (
        <div className={summaryBox}>
          {summary.diff ? (
            <DiffBlock code={summary.code} lang={summary.lang} />
          ) : (
            <ShikiBlock code={summary.code} lang={summary.lang} />
          )}
        </div>
      )}

      <div className={actions}>
        <Button
          variant="outline"
          size="sm"
          onClick={onDeny}
          style={{ flex: 1 }}
        >
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
});
