import { useEffect, useRef, useState } from "react";

import {
  shikiFallbackCode,
  shikiFallbackPre,
  shikiWrapClass,
} from "@/styles/Markdown.styles";
import { highlight } from "@/utils/shiki-highlighter";

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
    <pre className={shikiFallbackPre}>
      <code className={shikiFallbackCode}>{code}</code>
    </pre>
  );
}
