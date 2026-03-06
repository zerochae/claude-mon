const ESC = "\x1b";

export function ansiToHtml(input: string): string {
  let result = "";
  let i = 0;
  let openSpans = 0;

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
      const style = parseSgr(codes);

      if (style === null) {
        while (openSpans > 0) {
          result += "</span>";
          openSpans--;
        }
      } else if (style) {
        result += `<span style="${style}">`;
        openSpans++;
      }
      i = end + 1;
    } else {
      result += escapeHtml(input[i]);
      i++;
    }
  }

  while (openSpans > 0) {
    result += "</span>";
    openSpans--;
  }

  return result;
}

function parseSgr(codes: number[]): string | null {
  if (codes.length === 0 || (codes.length === 1 && codes[0] === 0)) return null;

  const styles: string[] = [];
  let i = 0;

  while (i < codes.length) {
    const c = codes[i];

    if (c === 0) {
      return null;
    } else if (c === 1) {
      styles.push("font-weight:bold");
    } else if (c === 2) {
      styles.push("opacity:0.7");
    } else if (c === 3) {
      styles.push("font-style:italic");
    } else if (c === 4) {
      styles.push("text-decoration:underline");
    } else if (c >= 30 && c <= 37) {
      styles.push(`color:${ansi256(c - 30)}`);
    } else if (c === 38 && codes[i + 1] === 2 && i + 4 < codes.length) {
      styles.push(`color:rgb(${codes[i + 2]},${codes[i + 3]},${codes[i + 4]})`);
      i += 4;
    } else if (c === 38 && codes[i + 1] === 5 && i + 2 < codes.length) {
      styles.push(`color:${ansi256(codes[i + 2])}`);
      i += 2;
    } else if (c >= 40 && c <= 47) {
      styles.push(`background:${ansi256(c - 40)}`);
    } else if (c === 48 && codes[i + 1] === 2 && i + 4 < codes.length) {
      styles.push(`background:rgb(${codes[i + 2]},${codes[i + 3]},${codes[i + 4]})`);
      i += 4;
    } else if (c === 48 && codes[i + 1] === 5 && i + 2 < codes.length) {
      styles.push(`background:${ansi256(codes[i + 2])}`);
      i += 2;
    } else if (c >= 90 && c <= 97) {
      styles.push(`color:${ansi256(c - 90 + 8)}`);
    }
    i++;
  }

  return styles.length > 0 ? styles.join(";") : "";
}

const BASIC_COLORS = [
  "#282c34", "#e06c75", "#98c379", "#e5c07b",
  "#61afef", "#c678dd", "#56b6c2", "#abb2bf",
  "#5c6370", "#e06c75", "#98c379", "#e5c07b",
  "#61afef", "#c678dd", "#56b6c2", "#ffffff",
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
    case "&": return "&amp;";
    case "<": return "&lt;";
    case ">": return "&gt;";
    case '"': return "&quot;";
    default: return ch;
  }
}

export function hasAnsi(s: string): boolean {
  return s.includes(ESC);
}
