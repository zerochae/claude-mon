import React from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { extensions } from "@/constants/glyph";
import { CALLOUT_ICONS_MAP } from "@/constants/callout";
import { parseCallout, preInner } from "@/utils/markdown.utils";
import { ShikiBlock } from "@/components/Markdown.ShikiBlock";
import { DiffBlock } from "@/components/Markdown.DiffBlock";
import {
  CALLOUT_COLORS,
  type ColorToken,
  blockquoteRecipe,
  calloutHeading,
  calloutIcon,
  calloutContent,
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
    const match = /language-([\w:]+)/.exec(className ?? "");
    if (match) {
      const raw = match[1];
      const codeStr = (
        Array.isArray(children) ? children.join("") : (children as string)
      ).replace(/\n$/, "");

      if (raw.startsWith("diff:") && raw.length > 5) {
        return <DiffBlock code={codeStr} lang={raw.slice(5)} />;
      }

      return <ShikiBlock lang={raw} code={codeStr} />;
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
      const m = /language-([\w:]+)/.exec(cls);
      if (m) lang = m[1];
    }

    const isDiff = lang.startsWith("diff:");
    const displayLang = isDiff ? lang.slice(5) : lang;

    return (
      <div className={preOuter}>
        {displayLang &&
          (() => {
            const ext = (
              extensions as Record<
                string,
                { icon: string; color: string; name: string } | undefined
              >
            )[displayLang];
            return (
              <div className={langBar}>
                {ext && (
                  <span style={{ color: ext.color }} className={langIcon}>
                    {ext.icon}
                  </span>
                )}
                {isDiff ? `${ext?.name ?? displayLang} (diff)` : (ext?.name ?? displayLang)}
              </div>
            );
          })()}
        <pre style={preInner(displayLang)} {...rest}>
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

export const Markdown = React.memo(function Markdown({
  content,
}: MarkdownProps) {
  return (
    <div className={markdownWrap}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
});
