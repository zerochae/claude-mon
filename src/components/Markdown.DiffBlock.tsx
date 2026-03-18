import { css } from "@styled-system/css";
import { useEffect, useRef, useState } from "react";

import {
  diffCode,
  diffFallbackText,
  diffPre,
  shikiWrapClass,
} from "@/styles/Markdown.styles";
import { highlightLines } from "@/utils/shiki-highlighter";

interface DiffLine {
  type: "add" | "del" | "ctx";
  code: string;
}

function parseDiffLines(code: string): DiffLine[] {
  return code.split("\n").map((line) => {
    if (line.startsWith("+ ")) return { type: "add", code: line.slice(2) };
    if (line.startsWith("- ")) return { type: "del", code: line.slice(2) };
    if (line.startsWith("  ")) return { type: "ctx", code: line.slice(2) };
    return { type: "ctx", code: line };
  });
}

const lineStyle = css({
  display: "block",
  px: "0.4rem",
  minHeight: "1.3em",
  minWidth: "fit-content",
  whiteSpace: "pre",
});

const addBg = css({ bg: "rgba(80, 160, 80, 0.12)" });
const delBg = css({ bg: "rgba(200, 80, 80, 0.12)" });

const marker = css({
  display: "inline-block",
  width: "1.2em",
  flexShrink: 0,
  userSelect: "none",
  fontWeight: 700,
});

const addMarker = css({ color: "green" });
const delMarker = css({ color: "red" });
const ctxMarker = css({ color: "comment" });

export function DiffBlock({ code, lang }: { code: string; lang: string }) {
  const lines = parseDiffLines(code);
  const pureCode = lines.map((l) => l.code).join("\n");

  const [hlLines, setHlLines] = useState<string[] | null>(null);
  const codeRef = useRef(pureCode);

  useEffect(() => {
    let cancelled = false;
    codeRef.current = pureCode;

    void highlightLines(pureCode, lang).then((result) => {
      if (!cancelled && codeRef.current === pureCode) {
        setHlLines(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [pureCode, lang]);

  return (
    <div className={shikiWrapClass}>
      <pre className={diffPre}>
        <code className={diffCode}>
          {lines.map((line, i) => {
            const bgClass =
              line.type === "add" ? addBg : line.type === "del" ? delBg : "";
            const mkClass =
              line.type === "add"
                ? addMarker
                : line.type === "del"
                  ? delMarker
                  : ctxMarker;
            const mkChar =
              line.type === "add" ? "+" : line.type === "del" ? "-" : " ";

            return (
              <span key={i} className={`${lineStyle} ${bgClass}`}>
                <span className={`${marker} ${mkClass}`}>{mkChar}</span>
                {hlLines?.[i] !== undefined ? (
                  <span dangerouslySetInnerHTML={{ __html: hlLines[i] }} />
                ) : (
                  <span className={diffFallbackText}>{line.code}</span>
                )}
              </span>
            );
          })}
        </code>
      </pre>
    </div>
  );
}
