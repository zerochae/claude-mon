import { css, cva } from "@styled-system/css";

export const NERD = "'SpaceMonoNerd'";
export const MONO = `${NERD}, ui-monospace, SFMono-Regular, Menlo, monospace`;

export const CALLOUT_COLORS: Record<string, string> = {
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

export const CALLOUT_ICONS: Record<string, string> = {};

export type ColorToken =
  | "blue"
  | "green"
  | "yellow"
  | "red"
  | "magenta"
  | "cyan"
  | "comment"
  | "orange";

export const blockquoteRecipe = cva({
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

export const calloutHeading = cva({
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

export const calloutIcon = css({ fontSize: "0.8rem", fontFamily: NERD });
export const calloutContent = css({ color: "gray" });

export const shikiWrapClass = css({
  fontSize: "0.75rem",
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

export const markdownWrap = css({ userSelect: "text", cursor: "text" });

export const h1Style = css({
  color: "heading1",
  fontSize: "1.0rem",
  fontWeight: 700,
  letterSpacing: "-0.01em",
  mt: "0.6rem",
  mb: "0.3rem",
});

export const h2Style = css({
  color: "heading2",
  fontSize: "0.95rem",
  fontWeight: 700,
  letterSpacing: "-0.01em",
  mt: "0.6rem",
  mb: "0.25rem",
});

export const h3Style = css({
  color: "heading3",
  fontSize: "0.88rem",
  fontWeight: 600,
  mt: "0.5rem",
  mb: "0.2rem",
});

export const h4Style = css({
  color: "heading4",
  fontSize: "0.84rem",
  fontWeight: 600,
  mt: "0.4rem",
  mb: "0.15rem",
});

export const h5Style = css({
  color: "heading5",
  fontSize: "0.8rem",
  fontWeight: 600,
  mt: "0.35rem",
  mb: "0.1rem",
});

export const h6Style = css({
  color: "heading6",
  fontSize: "0.78rem",
  fontWeight: 600,
  mt: "0.3rem",
  mb: "0.1rem",
});

export const pStyle = css({
  color: "text",
  fontSize: "0.8rem",
  lineHeight: 1.6,
  mt: "0.15rem",
  mb: "0.15rem",
  overflowWrap: "break-word",
  wordBreak: "break-word",
});

export const strongStyle = css({
  color: "strong",
  fontWeight: 800,
  bg: "rgba(255, 255, 255, 0.06)",
  px: "0.2rem",
  py: "0.05rem",
  borderRadius: "3px",
});
export const emStyle = css({ color: "em", fontStyle: "italic" });
export const delStyle = css({ color: "del", textDecoration: "line-through" });

export const aStyle = css({
  color: "link",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "baseline",
  gap: "0.15rem",
  _hover: { textDecoration: "underline" },
});

export const inlineCode = css({
  color: "code",
  bg: "surfaceOverlay",
  px: "0.3rem",
  py: "0.05rem",
  borderRadius: "3px",
  fontSize: "0.75rem",
  fontFamily: MONO,
});

export const preOuter = css({
  pos: "relative",
  mt: "0.25rem",
  mb: "0.25rem",
  bg: "surfaceOverlay",
  borderRadius: "6px",
  border: "0.5px solid token(colors.hairline)",
  overflow: "hidden",
});

export const langBar = css({
  display: "flex",
  alignItems: "center",
  gap: "0.3rem",
  px: "0.6rem",
  py: "0.3rem",
  fontSize: "0.6rem",
  color: "textMuted",
  fontFamily: MONO,
});

export const langIcon = css({ fontSize: "0.85rem", fontFamily: NERD });

export const ulStyle = css({
  pl: "0.4rem",
  ml: "0.6rem",
  fontSize: "0.8rem",
  color: "text",
  listStyleType: "disc",
  mt: "0.15rem",
});

export const olStyle = css({
  pl: "0.4rem",
  ml: "0.6rem",
  fontSize: "0.8rem",
  color: "text",
  listStyleType: "decimal",
  mt: "0.15rem",
});

export const liStyle = css({
  my: "0.1rem",
  lineHeight: 1.6,
  fontSize: "0.8rem",
});

export const hrStyle = css({ my: "0.5rem", h: "1.5px", opacity: 0.3 });

export const tableWrap = css({ overflowX: "auto", my: "0.3rem" });

export const tableStyle = css({
  width: "100%",
  fontSize: "0.75rem",
  borderCollapse: "collapse",
});

export const trStyle = css({
  borderBottom: "0.5px solid",
  borderColor: "hairline",
  transition: "background-color 120ms cubic-bezier(0.2, 0, 0, 1)",
  _hover: { bg: "surfaceHover" },
  _even: { bg: "surfaceHover" },
});

export const thStyle = css({
  color: "text",
  fontWeight: 700,
  p: "0.25rem 0.4rem",
  borderBottom: "1px solid",
  borderColor: "hairline",
  textAlign: "left",
});

export const tdStyle = css({ color: "text", p: "0.25rem 0.4rem" });
