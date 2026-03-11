const C = {
  add: "#98c379",
  del: "#e06c75",
  hunk: "#c678dd",
  meta: "#61afef",
  hash: "#e5c07b",
  dim: "#5c6370",
} as const;

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function span(color: string, text: string, bold = false): string {
  const s = bold ? `color:${color};font-weight:bold` : `color:${color}`;
  return `<span style="${s}">${esc(text)}</span>`;
}

export function highlightGitDiff(raw: string): string {
  return raw
    .split("\n")
    .map((line) => {
      if (line.startsWith("+++") || line.startsWith("---"))
        return span(C.meta, line, true);
      if (line.startsWith("@@")) return span(C.hunk, line, true);
      if (line.startsWith("diff --git")) return span(C.meta, line, true);
      if (
        line.startsWith("index ") ||
        line.startsWith("new file") ||
        line.startsWith("deleted file")
      )
        return span(C.dim, line);
      if (line.startsWith("+")) return span(C.add, line);
      if (line.startsWith("-")) return span(C.del, line);
      return esc(line);
    })
    .join("\n");
}

export function highlightGitLog(raw: string): string {
  return raw
    .split("\n")
    .map((line) => {
      const commitMatch = /^(commit )?([0-9a-f]{7,40})(.*)$/.exec(line);
      if (
        commitMatch &&
        (commitMatch[1] || line === commitMatch[2] + commitMatch[3])
      ) {
        const prefix = commitMatch[1] || "";
        return (
          span(C.dim, prefix) +
          span(C.hash, commitMatch[2]) +
          esc(commitMatch[3])
        );
      }
      if (/^(Author|Date|Merge):/.test(line)) return span(C.dim, line);
      return esc(line);
    })
    .join("\n");
}

export function highlightGitStatus(raw: string): string {
  return raw
    .split("\n")
    .map((line) => {
      if (/^\s*M\s/.test(line) || line.includes("modified:"))
        return span(C.hash, line);
      if (/^\s*A\s/.test(line) || line.includes("new file:"))
        return span(C.add, line);
      if (/^\s*D\s/.test(line) || line.includes("deleted:"))
        return span(C.del, line);
      if (/^\?\?\s/.test(line) || line.includes("Untracked"))
        return span(C.dim, line);
      if (line.startsWith("On branch") || line.startsWith("Your branch"))
        return span(C.meta, line);
      return esc(line);
    })
    .join("\n");
}

export type GitOutputType = "diff" | "log" | "status" | null;

export function detectGitOutput(
  content: string,
  output: string,
): GitOutputType {
  if (/\bgit\s+diff\b/.test(content)) return "diff";
  if (/\bgit\s+log\b/.test(content)) return "log";
  if (/\bgit\s+status\b/.test(content)) return "status";
  if (output.startsWith("diff --git")) return "diff";
  if (output.startsWith("commit ") || /^[0-9a-f]{7,40}\s/.test(output))
    return "log";
  if (output.startsWith("On branch ")) return "status";
  return null;
}

export function highlightGitOutput(
  content: string,
  output: string,
): string | null {
  const type = detectGitOutput(content, output);
  if (!type) return null;
  if (type === "diff") return highlightGitDiff(output);
  if (type === "log") return highlightGitLog(output);
  return highlightGitStatus(output);
}
