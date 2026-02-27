import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { css, cva } from "@styled-system/css";
import { ui, extensions } from "@/lib/glyph";
import { highlight } from "@/lib/shiki-highlighter";

interface MarkdownProps {
  content: string;
}


const CALLOUT_COLORS: Record<string, string> = {
  note: "blue",
  info: "blue",
  tip: "green",
  success: "green",
  check: "green",
  done: "green",
  warning: "yellow",
  caution: "yellow",
  attention: "yellow",
  danger: "red",
  error: "red",
  bug: "red",
  failure: "red",
  important: "magenta",
  question: "cyan",
  help: "cyan",
  quote: "comment",
  example: "orange",
  abstract: "cyan",
  todo: "yellow",
};

const CALLOUT_ICONS: Record<string, string> = {
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

const NERD = "'SpaceMonoNerd'";
const MONO = `${NERD}, ui-monospace, SFMono-Regular, Menlo, monospace`;

type ColorToken =
  | "blue"
  | "green"
  | "yellow"
  | "red"
  | "magenta"
  | "cyan"
  | "comment"
  | "orange";

const blockquoteRecipe = cva({
  base: {
    borderLeft: "3px solid",
    pl: "0.6rem",
    pr: "0.6rem",
    ml: 0,
    fontStyle: "italic",
    fontSize: "0.85rem",
    mt: "0.3rem",
    mb: "0.3rem",
  },
  variants: {
    colorToken: {
      blue: { borderLeftColor: "blue" },
      green: { borderLeftColor: "green" },
      yellow: { borderLeftColor: "yellow" },
      red: { borderLeftColor: "red" },
      magenta: { borderLeftColor: "magenta" },
      cyan: { borderLeftColor: "cyan" },
      comment: { borderLeftColor: "comment" },
      orange: { borderLeftColor: "orange" },
    },
  },
  defaultVariants: { colorToken: "blue" },
});

const calloutHeading = cva({
  base: {
    display: "flex",
    alignItems: "center",
    gap: "0.3rem",
    mb: "0.25rem",
    fontStyle: "normal",
    fontWeight: 600,
    fontSize: "0.8rem",
    textTransform: "capitalize",
  },
  variants: {
    colorToken: {
      blue: { color: "blue" },
      green: { color: "green" },
      yellow: { color: "yellow" },
      red: { color: "red" },
      magenta: { color: "magenta" },
      cyan: { color: "cyan" },
      comment: { color: "comment" },
      orange: { color: "orange" },
    },
  },
  defaultVariants: { colorToken: "blue" },
});

const calloutIcon = css({ fontSize: "0.8rem", fontFamily: NERD });
const calloutContent = css({ color: "gray" });

const shikiWrapClass = css({
  fontSize: "0.8rem",
  lineHeight: 1.5,
  fontFamily: MONO,
  "& pre": {
    bg: "transparent !important",
    m: 0,
    p: 0,
    overflow: "visible",
  },
  "& code": {
    fontFamily: `${MONO} !important`,
    bg: "transparent !important",
  },
});

function ShikiBlock({ code, lang }: { code: string; lang: string }) {
  const [html, setHtml] = useState<string | null>(null);
  const codeRef = useRef(code);
  const langRef = useRef(lang);

  useEffect(() => {
    let cancelled = false;
    codeRef.current = code;
    langRef.current = lang;
    highlight(code, lang).then((result) => {
      if (!cancelled && codeRef.current === code && langRef.current === lang) {
        setHtml(result);
      }
    });
    return () => { cancelled = true; };
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
    <pre style={{ margin: 0, padding: 0, background: "transparent", fontSize: "0.8rem", lineHeight: 1.5 }}>
      <code style={{ fontFamily: MONO, color: "var(--colors-text, #abb2bf)" }}>{code}</code>
    </pre>
  );
}

const components: Components = {
  h1: ({ node: _, ...rest }) => (
    <h1
      className={css({
        color: "heading1",
        fontSize: "1.1rem",
        fontWeight: 700,
        letterSpacing: "-0.01em",
        mt: "0.6rem",
        mb: "0.3rem",
      })}
      {...rest}
    />
  ),
  h2: ({ node: _, ...rest }) => (
    <h2
      className={css({
        color: "heading2",
        fontSize: "1.0rem",
        fontWeight: 700,
        letterSpacing: "-0.01em",
        mt: "0.6rem",
        mb: "0.25rem",
      })}
      {...rest}
    />
  ),
  h3: ({ node: _, ...rest }) => (
    <h3
      className={css({
        color: "heading3",
        fontSize: "0.95rem",
        fontWeight: 600,
        mt: "0.5rem",
        mb: "0.2rem",
      })}
      {...rest}
    />
  ),
  h4: ({ node: _, ...rest }) => (
    <h4
      className={css({
        color: "heading4",
        fontSize: "0.9rem",
        fontWeight: 600,
        mt: "0.4rem",
        mb: "0.15rem",
      })}
      {...rest}
    />
  ),
  h5: ({ node: _, ...rest }) => (
    <h5
      className={css({
        color: "heading5",
        fontSize: "0.85rem",
        fontWeight: 600,
        mt: "0.35rem",
        mb: "0.1rem",
      })}
      {...rest}
    />
  ),
  h6: ({ node: _, ...rest }) => (
    <h6
      className={css({
        color: "heading6",
        fontSize: "0.82rem",
        fontWeight: 600,
        mt: "0.3rem",
        mb: "0.1rem",
      })}
      {...rest}
    />
  ),
  p: ({ node: _, ...rest }) => (
    <p
      className={css({
        color: "text",
        fontSize: "0.85rem",
        lineHeight: 1.6,
        mt: "0.15rem",
        mb: "0.5rem",
        overflowWrap: "break-word",
        wordBreak: "break-word",
      })}
      {...rest}
    />
  ),
  strong: ({ node: _, ...rest }) => (
    <strong className={css({ color: "strong", fontWeight: 800 })} {...rest} />
  ),
  em: ({ node: _, ...rest }) => (
    <em className={css({ color: "em", fontStyle: "italic" })} {...rest} />
  ),
  del: ({ node: _, ...rest }) => (
    <del
      className={css({ color: "del", textDecoration: "line-through" })}
      {...rest}
    />
  ),
  a: ({ node: _, children, ...rest }) => (
    <a
      className={css({
        color: "link",
        textDecoration: "none",
        display: "inline-flex",
        alignItems: "baseline",
        gap: "0.15rem",
        _hover: { textDecoration: "underline" },
      })}
      {...rest}
    >
      {children}
    </a>
  ),
  code: ({ node: _, className, children, ...rest }) => {
    const match = /language-(\w+)/.exec(className ?? "");
    if (match) {
      return <ShikiBlock lang={match[1]} code={(Array.isArray(children) ? children.join("") : (children as string)).replace(/\n$/, "")} />;
    }
    return (
      <code
        className={css({
          color: "code",
          bg: "surfaceOverlay",
          px: "0.3rem",
          py: "0.05rem",
          borderRadius: "3px",
          fontSize: "0.8rem",
          fontFamily: MONO,
        })}
        {...rest}
      >
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
      <div
        className={css({
          pos: "relative",
          mt: "0.25rem",
          mb: "0.25rem",
          bg: "surfaceOverlay",
          borderRadius: "6px",
          border: "0.5px solid token(colors.hairline)",
          overflow: "hidden",
        })}
      >
        {lang && (() => {
          const ext = extensions[lang as keyof typeof extensions];
          return (
            <div
              className={css({
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
                px: "0.6rem",
                py: "0.3rem",
                fontSize: "0.65rem",
                color: "comment",
                fontFamily: MONO,
              })}
            >
              {ext && (
                <span
                  style={{ color: ext.color }}
                  className={css({ fontSize: "0.85rem", fontFamily: NERD })}
                >
                  {ext.icon}
                </span>
              )}
              {ext?.name ?? lang}
            </div>
          );
        })()}
        <pre
          className={css({
            bg: "transparent",
            color: "preText",
            p: "0.5rem 0.6rem",
            pt: lang ? "0" : "0.5rem",
            overflowX: "auto",
            maxW: "100%",
            fontSize: "0.8rem",
          })}
          {...rest}
        >
          {children}
        </pre>
      </div>
    );
  },
  ul: ({ node: _, ...rest }) => (
    <ul
      className={css({
        pl: "0.4rem",
        ml: "0.6rem",
        fontSize: "0.85rem",
        color: "text",
        listStyleType: "disc",
        mt: "0.15rem",
      })}
      {...rest}
    />
  ),
  ol: ({ node: _, ...rest }) => (
    <ol
      className={css({
        pl: "0.4rem",
        ml: "0.6rem",
        fontSize: "0.85rem",
        color: "text",
        listStyleType: "decimal",
        mt: "0.15rem",
      })}
      {...rest}
    />
  ),
  li: ({ node: _, ...rest }) => (
    <li
      className={css({ my: "0.1rem", lineHeight: 1.6, fontSize: "0.85rem" })}
      {...rest}
    />
  ),
  blockquote: ({ node: _, children }) => {
    const { tag, content } = parseCallout(children);
    const colorToken = (
      tag ? (CALLOUT_COLORS[tag] ?? "blue") : "blue"
    ) as ColorToken;
    const icon = tag
      ? (CALLOUT_ICONS[tag] ??
        CALLOUT_ICONS[
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
      className={css({ my: "0.5rem", h: "1.5px", opacity: 0.3 })}
      style={{
        background:
          "linear-gradient(to right, transparent, var(--colors-text, #abb2bf), transparent)",
      }}
    />
  ),
  table: ({ node: _, ...rest }) => (
    <div className={css({ overflowX: "auto", my: "0.3rem" })}>
      <table
        className={css({
          width: "100%",
          fontSize: "0.8rem",
          borderCollapse: "collapse",
        })}
        {...rest}
      />
    </div>
  ),
  thead: ({ node: _, ...rest }) => <thead {...rest} />,
  tr: ({ node: _, ...rest }) => (
    <tr
      className={css({
        borderBottom: "0.5px solid",
        borderColor: "hairline",
        transition: "background-color 120ms cubic-bezier(0.2, 0, 0, 1)",
        _hover: { bg: "surfaceHover" },
        _even: { bg: "surfaceHover" },
      })}
      {...rest}
    />
  ),
  th: ({ node: _, ...rest }) => (
    <th
      className={css({
        color: "text",
        fontWeight: 700,
        p: "0.25rem 0.4rem",
        borderBottom: "1px solid",
        borderColor: "hairline",
        textAlign: "left",
      })}
      {...rest}
    />
  ),
  td: ({ node: _, ...rest }) => (
    <td className={css({ color: "text", p: "0.25rem 0.4rem" })} {...rest} />
  ),
};

const markdownWrap = css({ userSelect: "text", cursor: "text" });

export function Markdown({ content }: MarkdownProps) {
  return (
    <div className={markdownWrap}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
