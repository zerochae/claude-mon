import { createHighlighter, type Highlighter } from "shiki";

const C = {
  text: "var(--colors-text, #abb2bf)",
  comment: "var(--colors-comment, #565c64)",
  red: "var(--colors-red, #E06C75)",
  orange: "var(--colors-orange, #d19a66)",
  green: "var(--colors-green, #98c379)",
  blue: "var(--colors-blue, #61afef)",
  magenta: "var(--colors-magenta, #c678dd)",
  cyan: "var(--colors-cyan, #56b6c2)",
  yellow: "var(--colors-yellow, #e5c07b)",
};

const ONEDARK_CSS_VARS = {
  name: "onedark-css-vars",
  type: "dark" as const,
  colors: {
    "editor.background": "#00000000",
    "editor.foreground": C.text,
  },
  tokenColors: [
    {
      scope: ["comment", "punctuation.definition.comment", "string.comment"],
      settings: { foreground: C.comment },
    },
    {
      scope: ["constant", "entity.name.constant", "variable.language"],
      settings: { foreground: C.orange },
    },
    { scope: ["entity", "entity.name"], settings: { foreground: C.blue } },
    {
      scope: ["variable.parameter.function", "meta.function-call.arguments"],
      settings: { foreground: C.text },
    },
    { scope: ["entity.name.tag"], settings: { foreground: C.red } },
    {
      scope: [
        "keyword",
        "storage.type.class.python",
        "keyword.operator.new",
        "keyword.operator.expression",
      ],
      settings: { foreground: C.magenta },
    },
    { scope: ["storage", "storage.type"], settings: { foreground: C.magenta } },
    {
      scope: [
        "storage.modifier.package",
        "storage.modifier.import",
        "storage.type.java",
      ],
      settings: { foreground: C.text },
    },
    {
      scope: ["string", "string punctuation.section.embedded source"],
      settings: { foreground: C.green },
    },
    { scope: ["support"], settings: { foreground: C.cyan } },
    { scope: ["meta.property-name"], settings: { foreground: C.red } },
    { scope: ["variable"], settings: { foreground: C.red } },
    {
      scope: ["variable.other", "variable.other.readwrite"],
      settings: { foreground: C.text },
    },
    { scope: ["invalid.broken"], settings: { foreground: C.red } },
    { scope: ["invalid.deprecated"], settings: { foreground: C.red } },
    { scope: ["invalid.illegal"], settings: { foreground: C.red } },
    { scope: ["invalid.unimplemented"], settings: { foreground: C.red } },
    { scope: ["carriage-return"], settings: { foreground: C.text } },
    { scope: ["message.error"], settings: { foreground: C.red } },
    { scope: ["string source"], settings: { foreground: C.text } },
    { scope: ["string variable"], settings: { foreground: C.blue } },
    {
      scope: ["source.regexp", "string.regexp"],
      settings: { foreground: C.green },
    },
    {
      scope: [
        "string.regexp.character-class",
        "string.regexp constant.character.escape",
        "string.regexp source.ruby.embedded",
        "string.regexp string.regexp.arbitrary-repitition",
      ],
      settings: { foreground: C.green },
    },
    {
      scope: ["string.regexp constant.character.escape"],
      settings: { foreground: C.yellow },
    },
    { scope: ["support.constant"], settings: { foreground: C.orange } },
    { scope: ["support.variable"], settings: { foreground: C.red } },
    { scope: ["meta.module-reference"], settings: { foreground: C.blue } },
    { scope: ["markup.list"], settings: { foreground: C.red } },
    {
      scope: ["markup.heading", "markup.heading entity.name"],
      settings: { foreground: C.blue },
    },
    { scope: ["markup.quote"], settings: { foreground: C.magenta } },
    {
      scope: ["markup.italic"],
      settings: { fontStyle: "italic", foreground: C.text },
    },
    {
      scope: ["markup.bold"],
      settings: { fontStyle: "bold", foreground: C.text },
    },
    { scope: ["markup.raw"], settings: { foreground: C.cyan } },
    {
      scope: ["markup.deleted", "punctuation.definition.deleted"],
      settings: { foreground: C.red },
    },
    {
      scope: ["markup.inserted", "punctuation.definition.inserted"],
      settings: { foreground: C.green },
    },
    { scope: ["markup.changed"], settings: { foreground: C.orange } },
    {
      scope: [
        "punctuation",
        "meta.brace.round",
        "meta.brace.square",
        "meta.brace.angle",
      ],
      settings: { foreground: C.cyan },
    },
    { scope: ["meta.separator"], settings: { foreground: C.text } },
    { scope: ["meta.output"], settings: { foreground: C.text } },
    {
      scope: [
        "entity.name.function",
        "support.function",
        "meta.function-call entity.name.function",
      ],
      settings: { foreground: C.blue },
    },
    {
      scope: [
        "entity.name.type",
        "entity.name.class",
        "support.class",
        "support.type",
        "support.type.primitive",
      ],
      settings: { foreground: C.yellow },
    },
    { scope: ["keyword.operator"], settings: { foreground: C.cyan } },
    {
      scope: ["constant.numeric", "constant.language", "constant.character"],
      settings: { foreground: C.orange },
    },
    {
      scope: [
        "variable.other.property",
        "meta.property.object",
        "meta.object-literal.key",
      ],
      settings: { foreground: C.red },
    },
    {
      scope: [
        "support.type.property-name.json",
        "support.type.property-name.json5",
      ],
      settings: { foreground: C.red },
    },
    { scope: ["meta.embedded"], settings: { foreground: C.text } },
  ],
};

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  highlighterPromise ??= createHighlighter({
    themes: [
      ONEDARK_CSS_VARS as Parameters<typeof createHighlighter>[0]["themes"][0],
    ],
    langs: [
      "typescript",
      "tsx",
      "javascript",
      "jsx",
      "json",
      "json5",
      "html",
      "css",
      "scss",
      "python",
      "rust",
      "go",
      "bash",
      "sh",
      "zsh",
      "yaml",
      "toml",
      "markdown",
      "mdx",
      "sql",
      "graphql",
      "java",
      "kotlin",
      "swift",
      "c",
      "cpp",
      "csharp",
      "ruby",
      "php",
      "r",
      "lua",
      "vim",
      "dockerfile",
      "regex",
      "xml",
      "diff",
      "plaintext",
      "text",
    ],
  });
  return highlighterPromise;
}

void getHighlighter();

const MAX_CACHE = 200;
const cache = new Map<string, string>();

export async function highlightLines(
  code: string,
  lang: string,
): Promise<string[]> {
  const highlighter = await getHighlighter();
  const resolvedLang = highlighter.getLoadedLanguages().includes(lang as never)
    ? lang
    : "plaintext";
  const { tokens } = highlighter.codeToTokens(code, {
    lang: resolvedLang as Parameters<
      typeof highlighter.codeToTokens
    >[1]["lang"],
    theme: "onedark-css-vars",
  });
  return tokens.map((lineTokens) =>
    lineTokens
      .map((t) => {
        const escaped = t.content
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        return t.color
          ? `<span style="color:${t.color}">${escaped}</span>`
          : escaped;
      })
      .join(""),
  );
}

export async function highlight(code: string, lang: string): Promise<string> {
  const key = `${lang}:${code}`;
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  const highlighter = await getHighlighter();

  const resolvedLang = highlighter.getLoadedLanguages().includes(lang as never)
    ? lang
    : "plaintext";

  const html = highlighter.codeToHtml(code, {
    lang: resolvedLang,
    theme: "onedark-css-vars",
  });

  if (cache.size >= MAX_CACHE) {
    const { value: firstKey } = cache.keys().next();
    if (typeof firstKey === "string") cache.delete(firstKey);
  }
  cache.set(key, html);
  return html;
}
