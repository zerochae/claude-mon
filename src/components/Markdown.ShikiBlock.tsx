import { useState, useEffect, useRef } from "react";
import { highlight } from "@/utils/shiki-highlighter";
import { MONO, shikiWrapClass } from "@/styles/Markdown.styles";

export function ShikiBlock({ code, lang }: { code: string; lang: string }) {
  const [html, setHtml] = useState<string | null>(null);
  const codeRef = useRef(code);
  const langRef = useRef(lang);

  useEffect(() => {
    let cancelled = false;
    codeRef.current = code;
    langRef.current = lang;
    void highlight(code, lang).then((result) => {
      if (!cancelled && codeRef.current === code && langRef.current === lang) {
        setHtml(result);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [code, lang]);

  if (html) {
    return (
      <div
        className={shikiWrapClass}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <pre
      style={{
        margin: 0,
        padding: 0,
        background: "transparent",
        fontSize: "0.8rem",
        lineHeight: 1.5,
      }}
    >
      <code style={{ fontFamily: MONO, color: "var(--colors-text, #abb2bf)" }}>
        {code}
      </code>
    </pre>
  );
}
