import { css } from "@styled-system/css";

import { Glyph } from "@/components/Glyph";
import { DiffBlock } from "@/components/Markdown.DiffBlock";
import { extensions } from "@/constants/glyph";

interface GitDiffFile {
  path: string;
  ext: string;
  hunks: string;
}

function parseGitDiff(raw: string): GitDiffFile[] {
  const files: GitDiffFile[] = [];
  const sections = raw.split(/^diff --git /m).filter(Boolean);

  for (const section of sections) {
    const lines = section.split("\n");
    const headerMatch = /^a\/(.+?) b\//.exec(lines[0]);
    const filePath = headerMatch?.[1] ?? "";
    const ext = filePath.split(".").pop()?.toLowerCase() ?? "";

    const diffLines: string[] = [];
    let inHunk = false;

    for (const line of lines.slice(1)) {
      if (line.startsWith("@@")) {
        inHunk = true;
        continue;
      }
      if (!inHunk) continue;
      if (line.startsWith("+")) {
        diffLines.push("+ " + line.slice(1));
      } else if (line.startsWith("-")) {
        diffLines.push("- " + line.slice(1));
      } else if (line.startsWith(" ") || line === "") {
        diffLines.push("  " + (line.startsWith(" ") ? line.slice(1) : line));
      }
    }

    if (diffLines.length > 0) {
      files.push({ path: filePath, ext, hunks: diffLines.join("\n") });
    }
  }
  return files;
}

const fileHeader = css({
  display: "flex",
  alignItems: "center",
  gap: "4px",
  fontSize: "0.72rem",
  color: "textMuted",
  py: "3px",
  px: "4px",
});

const fileName = css({
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

const container = css({
  display: "flex",
  flexDirection: "column",
  gap: "6px",
});

export function GitDiffBlock({ output }: { output: string }) {
  const files = parseGitDiff(output);
  if (files.length === 0) return null;

  return (
    <div className={container}>
      {files.map((file, i) => {
        const extInfo = (
          extensions as Record<
            string,
            { icon: string; color: string; name: string } | undefined
          >
        )[file.ext];
        return (
          <div key={i}>
            <div className={fileHeader}>
              {extInfo && (
                <Glyph size={12} color={extInfo.color}>
                  {extInfo.icon}
                </Glyph>
              )}
              <span className={fileName}>{file.path}</span>
            </div>
            <DiffBlock code={file.hunks} lang={file.ext} />
          </div>
        );
      })}
    </div>
  );
}
