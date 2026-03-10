import { simpleDiff } from "@/utils/diff";

export type SummaryResult = {
  code: string;
  lang: string;
  diff?: boolean;
} | null;

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

export function extractSummary(
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

export function getDisplayPath(
  filePath: string | undefined,
  cwd: string | undefined,
): string | undefined {
  if (!filePath) return undefined;
  if (cwd && filePath.startsWith(cwd))
    return filePath.slice(cwd.endsWith("/") ? cwd.length : cwd.length + 1);
  return filePath;
}
