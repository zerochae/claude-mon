import {
  defineConfig,
  defineSemanticTokens,
  defineTokens,
  defineKeyframes,
} from "@pandacss/dev";
import {
  onedarkColors,
  nordColors,
  onelightColors,
  tokyonightColors,
  ayulightColors,
  ayudarkColors,
  gruvboxlightColors,
  gruvboxdarkColors,
  blossomlightColors,
  githublightColors,
  githubdarkColors,
} from "./src/theme/colorscheme";

export const themeNames = [
  "onedark",
  "nord",
  "onelight",
  "tokyonight",
  "ayulight",
  "ayudark",
  "gruvboxlight",
  "gruvboxdark",
  "blossomlight",
  "githublight",
  "githubdark",
] as const;

function toTokens(colors: Record<string, string>) {
  return Object.entries(colors).reduce<Record<string, { value: string }>>(
    (acc, [key, value]) => {
      acc[key] = { value };
      return acc;
    },
    {},
  );
}

const FONT_BASE = "../src/styles/fonts";

const tokens = defineTokens({
  colors: toTokens(onedarkColors),
});

const semanticTokens = defineSemanticTokens({
  colors: {
    heading1: { value: "{colors.red}" },
    heading2: { value: "{colors.orange}" },
    heading3: { value: "{colors.green}" },
    heading4: { value: "{colors.blue}" },
    heading5: { value: "{colors.magenta}" },
    heading6: { value: "{colors.yellow}" },
    strong: { value: "{colors.cyan}" },
    em: { value: "{colors.yellow}" },
    del: { value: "{colors.comment}" },
    code: { value: "{colors.orange}" },
    codeBg: { value: "{colors.bg2}" },
    link: { value: "{colors.magenta}" },
    hr: { value: "{colors.border}" },
    preBg: { value: "{colors.bg}" },
    preText: { value: "{colors.text}" },
    inlineCodeBg: { value: "{colors.codeBg}" },
    inlineCodeText: { value: "{colors.code}" },
  },
});

const keyframes = defineKeyframes({
  "mascot-bounce": {
    "0%, 100%": { transform: "translateY(0)" },
    "50%": { transform: "translateY(-4px)" },
  },
  "bubble-blink": {
    "0%, 100%": { opacity: "1" },
    "50%": { opacity: "0.3" },
  },
  "mascot-appear": {
    from: { opacity: "0", transform: "scale(0.5)" },
    to: { opacity: "1", transform: "scale(1)" },
  },
  "view-enter": {
    from: { opacity: "0", transform: "translateY(6px)" },
    to: { opacity: "1", transform: "translateY(0)" },
  },
  "view-exit": {
    from: { opacity: "1", transform: "translateY(0)" },
    to: { opacity: "0", transform: "translateY(-4px)" },
  },
  "scale-in": {
    from: { opacity: "0", transform: "scale(0.96)" },
    to: { opacity: "1", transform: "scale(1)" },
  },
  "scale-out": {
    from: { opacity: "1", transform: "scale(1)" },
    to: { opacity: "0", transform: "scale(0.92)" },
  },
  "fade-in": {
    from: { opacity: "0" },
    to: { opacity: "1" },
  },
  "crab-drop": {
    from: { opacity: "0", transform: "translateY(-24px) scale(0.85)" },
    to: { opacity: "1", transform: "translateY(0) scale(0.85)" },
  },
  shake: {
    "0%, 100%": { transform: "translateX(0)" },
    "20%": { transform: "translateX(-3px)" },
    "40%": { transform: "translateX(3px)" },
    "60%": { transform: "translateX(-2px)" },
    "80%": { transform: "translateX(2px)" },
  },
  "zzz-float": {
    "0%, 100%": { opacity: "0.3", transform: "translateY(0)" },
    "50%": { opacity: "0.7", transform: "translateY(-3px)" },
  },
});

export default defineConfig({
  preflight: false,
  syntax: "object-literal",
  jsxFramework: "react",
  include: ["./src/**/*.{ts,tsx}"],
  exclude: [],
  outdir: "styled-system",
  globalFontface: {
    SpaceMonoNerd: [
      {
        src: `url("${FONT_BASE}/SpaceMonoNerdFontMono-Regular.ttf") format("truetype")`,
        fontWeight: 400,
        fontStyle: "normal",
        fontDisplay: "swap",
      },
      {
        src: `url("${FONT_BASE}/SpaceMonoNerdFontMono-Bold.ttf") format("truetype")`,
        fontWeight: 700,
        fontStyle: "normal",
        fontDisplay: "swap",
      },
      {
        src: `url("${FONT_BASE}/SpaceMonoNerdFontMono-Italic.ttf") format("truetype")`,
        fontWeight: 400,
        fontStyle: "italic",
        fontDisplay: "swap",
      },
      {
        src: `url("${FONT_BASE}/SpaceMonoNerdFontMono-BoldItalic.ttf") format("truetype")`,
        fontWeight: 700,
        fontStyle: "italic",
        fontDisplay: "swap",
      },
    ],
  },
  globalCss: {
    "*, *::before, *::after": {
      margin: 0,
      padding: 0,
      boxSizing: "border-box",
    },
    "html, body": {
      width: "100%",
      height: "100%",
      background: "transparent",
      overflow: "hidden",
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif",
      WebkitFontSmoothing: "antialiased",
      userSelect: "none",
    },
    "#root": {
      width: "100%",
      height: "100%",
      margin: "0 auto",
      fontSize: "var(--app-font-size, 12px)",
    },
    ".widget-container": {
      width: "100%",
      height: "100%",
      borderRadius: "8px",
      background: "var(--colors-bg, #1a1a26)",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      border: "none",
    },
    ".drag-handle": {
      WebkitAppRegion: "drag",
    },
    ".no-drag": {
      WebkitAppRegion: "no-drag",
    },
    "::-webkit-scrollbar": {
      width: "6px",
      height: "6px",
    },
    "::-webkit-scrollbar-track": {
      background: "transparent",
    },
    "::-webkit-scrollbar-thumb": {
      background: "var(--colors-bg4, #3a3f52)",
      borderRadius: "3px",
      backgroundClip: "padding-box",
      border: "1px solid transparent",
    },
    "::-webkit-scrollbar-thumb:hover": {
      background: "var(--colors-comment, #4c5360)",
    },
    ".mascot-slot": {
      transition: "transform 0.15s ease, filter 0.15s ease",
      animation: "mascot-appear 0.4s ease-out",
    },
    ".mascot-slot:hover": {
      transform: "scale(1.25)",
      filter: "drop-shadow(0 0 6px rgba(171, 178, 191, 0.4))",
      zIndex: 10,
    },
    "::selection": {
      background: "var(--colors-blue, #61afef)",
      color: "var(--colors-bg, #1a1a26)",
    },
    "*:focus-visible": {
      outline: "2px solid var(--colors-blue, #61afef)",
      outlineOffset: "1px",
      borderRadius: "4px",
    },
    "button, [role='button']": {
      WebkitTapHighlightColor: "transparent",
    },
    "input, textarea": {
      userSelect: "text",
    },
  },
  staticCss: {
    themes: themeNames as unknown as string[],
  },
  theme: {
    extend: {
      tokens,
      semanticTokens,
      keyframes,
    },
  },
  themes: {
    onedark: { tokens: { colors: toTokens(onedarkColors) } },
    nord: { tokens: { colors: toTokens(nordColors) } },
    onelight: { tokens: { colors: toTokens(onelightColors) } },
    tokyonight: { tokens: { colors: toTokens(tokyonightColors) } },
    ayulight: { tokens: { colors: toTokens(ayulightColors) } },
    ayudark: { tokens: { colors: toTokens(ayudarkColors) } },
    gruvboxlight: { tokens: { colors: toTokens(gruvboxlightColors) } },
    gruvboxdark: { tokens: { colors: toTokens(gruvboxdarkColors) } },
    blossomlight: { tokens: { colors: toTokens(blossomlightColors) } },
    githublight: { tokens: { colors: toTokens(githublightColors) } },
    githubdark: { tokens: { colors: toTokens(githubdarkColors) } },
  },
});
