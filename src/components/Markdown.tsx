import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { ui, extensions } from "@/constants/glyph";
import { highlight } from "@/utils/shiki-highlighter";
import {
  CALLOUT_COLORS,
  MONO,
  type ColorToken,
  blockquoteRecipe,
  calloutHeading,
  calloutIcon,
  calloutContent,
  shikiWrapClass,
  markdownWrap,
  h1Style,
  h2Style,
  h3Style,
  h4Style,
  h5Style,
  h6Style,
  pStyle,
  strongStyle,
  emStyle,
  delStyle,
  aStyle,
  inlineCode,
  preOuter,
  langBar,
  langIcon,
  ulStyle,
  olStyle,
  liStyle,
  hrStyle,
  tableWrap,
  tableStyle,
  trStyle,
  thStyle,
  tdStyle,
} from "@/styles/Markdown.styles";

interface MarkdownProps {
  content: string;
}

const CALLOUT_ICONS_MAP: Record<string, string> = {
  abstract: ui.abstract,
  summary: ui.summary,
  tldr: ui.tldr,
  todo: ui.todo,
  info: ui.info,
  success: ui.success,
  check: ui.check,
  done: ui.done,
  question: ui.question,
  help: ui.help,
  faq: ui.faq,
  failure: ui.failure,
  fail: ui.fail,
  missing: ui.missing,
  danger: ui.danger,
  error: ui.error,
  bug: ui.bug,
  example: ui.example,
  quote: ui.quote,
  cite: ui.cite,
  hint: ui.hint,
  attention: ui.attention,
  note: ui.note,
  tip: ui.tip,
  important: ui.important,
  warning: ui.warning,
  caution: ui.caution,
};

function parseCallout(children: React.ReactNode): {
  tag: string | null;
  content: React.ReactNode;
} {
  const arr = React.Children.toArray(children);
  if (arr.length === 0) return { tag: null, content: children };

  const firstIdx = arr.findIndex((c) => React.isValidElement(c));
  if (firstIdx === -1) return { tag: null, content: children };
  const first = arr[firstIdx];

  const innerChildren = (
    (first as React.ReactElement).props as { children?: React.ReactNode }
  ).children;
  if (!innerChildren) return { tag: null, content: children };

  const innerArr = React.Children.toArray(innerChildren);
  if (innerArr.length === 0) return { tag: null, content: children };

  const firstText = innerArr[0];
  if (typeof firstText !== "string") return { tag: null, content: children };

  const match = /^\s*\[!(\w+)\]\s*/.exec(firstText);
  if (!match) return { tag: null, content: children };

  const tag = match[1].toLowerCase();
  const cleaned = firstText.replace(/^\s*\[!\w+\]\s*/, "");
  const newInner = [cleaned, ...innerArr.slice(1)];
  const newFirst = React.cloneElement(
    first as React.ReactElement,
    {},
    ...newInner,
  );
  const rest = arr.filter((_, i) => i !== firstIdx);

  return { tag, content: [newFirst, ...rest] };
}

function ShikiBlock({ code, lang }: { code: string; lang: string }) {
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

const preInner = (lang: string) => ({
  background: "transparent",
  color: "var(--colors-preText, #abb2bf)",
  padding: "0.5rem 0.6rem",
  paddingTop: lang ? "0" : "0.5rem",
  overflowX: "auto" as const,
  maxWidth: "100%",
  fontSize: "0.8rem",
});

const components: Components = {
  h1: ({ node: _, ...rest }) => <h1 className={h1Style} {...rest} />,
  h2: ({ node: _, ...rest }) => <h2 className={h2Style} {...rest} />,
  h3: ({ node: _, ...rest }) => <h3 className={h3Style} {...rest} />,
  h4: ({ node: _, ...rest }) => <h4 className={h4Style} {...rest} />,
  h5: ({ node: _, ...rest }) => <h5 className={h5Style} {...rest} />,
  h6: ({ node: _, ...rest }) => <h6 className={h6Style} {...rest} />,
  p: ({ node: _, ...rest }) => <p className={pStyle} {...rest} />,
  strong: ({ node: _, ...rest }) => (
    <strong className={strongStyle} {...rest} />
  ),
  em: ({ node: _, ...rest }) => <em className={emStyle} {...rest} />,
  del: ({ node: _, ...rest }) => <del className={delStyle} {...rest} />,
  a: ({ node: _, children, ...rest }) => (
    <a className={aStyle} {...rest}>
      {children}
    </a>
  ),
  code: ({ node: _, className, children, ...rest }) => {
    const match = /language-(\w+)/.exec(className ?? "");
    if (match) {
      return (
        <ShikiBlock
          lang={match[1]}
          code={(Array.isArray(children)
            ? children.join("")
            : (children as string)
          ).replace(/\n$/, "")}
        />
      );
    }
    return (
      <code className={inlineCode} {...rest}>
        {children}
      </code>
    );
  },
  pre: ({ node: _, children, ...rest }) => {
    let lang = "";
    const child = React.Children.toArray(children)[0];
    if (React.isValidElement(child)) {
      const cls = (child.props as { className?: string }).className ?? "";
      const m = /language-(\w+)/.exec(cls);
      if (m) lang = m[1];
    }

    return (
      <div className={preOuter}>
        {lang &&
          (() => {
            const ext = (
              extensions as Record<
                string,
                { icon: string; color: string; name: string } | undefined
              >
            )[lang];
            return (
              <div className={langBar}>
                {ext && (
                  <span style={{ color: ext.color }} className={langIcon}>
                    {ext.icon}
                  </span>
                )}
                {ext?.name ?? lang}
              </div>
            );
          })()}
        <pre style={preInner(lang)} {...rest}>
          {children}
        </pre>
      </div>
    );
  },
  ul: ({ node: _, ...rest }) => <ul className={ulStyle} {...rest} />,
  ol: ({ node: _, ...rest }) => <ol className={olStyle} {...rest} />,
  li: ({ node: _, ...rest }) => <li className={liStyle} {...rest} />,
  blockquote: ({ node: _, children }) => {
    const { tag, content } = parseCallout(children);
    const colorToken = (
      tag ? (CALLOUT_COLORS[tag] ?? "blue") : "blue"
    ) as ColorToken;
    const icon = tag
      ? (CALLOUT_ICONS_MAP[tag] ??
        CALLOUT_ICONS_MAP[
          Object.keys(CALLOUT_COLORS).find(
            (k) => CALLOUT_COLORS[k] === colorToken,
          ) ?? "note"
        ])
      : null;

    return (
      <blockquote className={blockquoteRecipe({ colorToken })}>
        {tag && (
          <div className={calloutHeading({ colorToken })}>
            <span className={calloutIcon}>{icon}</span>
            {tag}
          </div>
        )}
        <div className={calloutContent}>{content}</div>
      </blockquote>
    );
  },
  hr: () => (
    <div
      className={hrStyle}
      style={{
        background:
          "linear-gradient(to right, transparent, var(--colors-text, #abb2bf), transparent)",
      }}
    />
  ),
  table: ({ node: _, ...rest }) => (
    <div className={tableWrap}>
      <table className={tableStyle} {...rest} />
    </div>
  ),
  thead: ({ node: _, ...rest }) => <thead {...rest} />,
  tr: ({ node: _, ...rest }) => <tr className={trStyle} {...rest} />,
  th: ({ node: _, ...rest }) => <th className={thStyle} {...rest} />,
  td: ({ node: _, ...rest }) => <td className={tdStyle} {...rest} />,
};

export const Markdown = React.memo(function Markdown({ content }: MarkdownProps) {
  return (
    <div className={markdownWrap}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
});
