const ESC = "\x1b";

interface SgrState {
  bold: boolean;
  dim: boolean;
  italic: boolean;
  underline: boolean;
  fgColor: string | null;
  bgColor: string | null;
}

function emptySgr(): SgrState {
  return {
    bold: false,
    dim: false,
    italic: false,
    underline: false,
    fgColor: null,
    bgColor: null,
  };
}

function sgrToStyle(s: SgrState): string {
  const parts: string[] = [];
  if (s.bold) parts.push("font-weight:bold");
  if (s.dim) parts.push("opacity:0.7");
  if (s.italic) parts.push("font-style:italic");
  if (s.underline) parts.push("text-decoration:underline");
  if (s.fgColor) parts.push(`color:${s.fgColor}`);
  if (s.bgColor) parts.push(`background:${s.bgColor}`);
  return parts.join(";");
}

export function ansiToHtml(input: string): string {
  let result = "";
  let i = 0;
  let spanOpen = false;
  const state = emptySgr();

  while (i < input.length) {
    if (input[i] === ESC && input[i + 1] === "[") {
      const end = input.indexOf("m", i + 2);
      if (end === -1) {
        result += escapeHtml(input[i]);
        i++;
        continue;
      }
      const seq = input.slice(i + 2, end);
      const codes = seq.split(";").map(Number);

      if (spanOpen) {
        result += "</span>";
        spanOpen = false;
      }

      applySgr(state, codes);
      const style = sgrToStyle(state);
      if (style) {
        result += `<span style="${style}">`;
        spanOpen = true;
      }

      i = end + 1;
    } else {
      result += escapeHtml(input[i]);
      i++;
    }
  }

  if (spanOpen) result += "</span>";
  return result;
}

function applySgr(state: SgrState, codes: number[]) {
  let i = 0;
  while (i < codes.length) {
    const c = codes[i];

    if (c === 0) {
      Object.assign(state, emptySgr());
    } else if (c === 1) {
      state.bold = true;
    } else if (c === 2) {
      state.dim = true;
    } else if (c === 3) {
      state.italic = true;
    } else if (c === 4) {
      state.underline = true;
    } else if (c === 22) {
      state.bold = false;
      state.dim = false;
    } else if (c === 23) {
      state.italic = false;
    } else if (c === 24) {
      state.underline = false;
    } else if (c === 39) {
      state.fgColor = null;
    } else if (c === 49) {
      state.bgColor = null;
    } else if (c >= 30 && c <= 37) {
      state.fgColor = ansi256(c - 30);
    } else if (c === 38 && codes[i + 1] === 2 && i + 4 < codes.length) {
      state.fgColor = `rgb(${clampByte(codes[i + 2])},${clampByte(codes[i + 3])},${clampByte(codes[i + 4])})`;
      i += 4;
    } else if (c === 38 && codes[i + 1] === 5 && i + 2 < codes.length) {
      state.fgColor = ansi256(codes[i + 2]);
      i += 2;
    } else if (c >= 40 && c <= 47) {
      state.bgColor = ansi256(c - 40);
    } else if (c === 48 && codes[i + 1] === 2 && i + 4 < codes.length) {
      state.bgColor = `rgb(${clampByte(codes[i + 2])},${clampByte(codes[i + 3])},${clampByte(codes[i + 4])})`;
      i += 4;
    } else if (c === 48 && codes[i + 1] === 5 && i + 2 < codes.length) {
      state.bgColor = ansi256(codes[i + 2]);
      i += 2;
    } else if (c >= 90 && c <= 97) {
      state.fgColor = ansi256(c - 90 + 8);
    }
    i++;
  }
}

const BASIC_COLORS = [
  "#282c34",
  "#e06c75",
  "#98c379",
  "#e5c07b",
  "#61afef",
  "#c678dd",
  "#56b6c2",
  "#abb2bf",
  "#5c6370",
  "#e06c75",
  "#98c379",
  "#e5c07b",
  "#61afef",
  "#c678dd",
  "#56b6c2",
  "#ffffff",
];

function ansi256(n: number): string {
  if (n < 16) return BASIC_COLORS[n];
  if (n < 232) {
    const idx = n - 16;
    const r = Math.floor(idx / 36) * 51;
    const g = (Math.floor(idx / 6) % 6) * 51;
    const b = (idx % 6) * 51;
    return `rgb(${r},${g},${b})`;
  }
  const gray = 8 + (n - 232) * 10;
  return `rgb(${gray},${gray},${gray})`;
}

function escapeHtml(ch: string): string {
  switch (ch) {
    case "&":
      return "&amp;";
    case "<":
      return "&lt;";
    case ">":
      return "&gt;";
    case '"':
      return "&quot;";
    case "'":
      return "&#39;";
    default:
      return ch;
  }
}

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.trunc(n) || 0));
}

export function hasAnsi(s: string): boolean {
  return s.includes(ESC);
}
