const MASCOT_COLOR_VARS = [
  "--colors-orange",
  "--colors-magenta",
  "--colors-green",
  "--colors-red",
  "--colors-blue",
  "--colors-yellow",
  "--colors-cyan",
  "--colors-peach",
  "--colors-lime",
  "--colors-sky",
  "--colors-aqua",
  "--colors-coral",
  "--colors-emerald",
  "--colors-lavender",
  "--colors-mint",
  "--colors-sapphire",
  "--colors-forest",
  "--colors-navy",
  "--colors-plum",
  "--colors-tangerine",
] as const;

const FALLBACKS: Record<string, string> = {
  "--colors-orange": "#d19a66",
  "--colors-magenta": "#c678dd",
  "--colors-green": "#98c379",
  "--colors-red": "#E06C75",
  "--colors-blue": "#61afef",
  "--colors-yellow": "#e5c07b",
  "--colors-cyan": "#56b6c2",
  "--colors-peach": "#e1717a",
  "--colors-lime": "#b3d39c",
  "--colors-sky": "#8fc6f4",
  "--colors-aqua": "#7bc6d0",
  "--colors-coral": "#d8868d",
  "--colors-emerald": "#a3c38c",
  "--colors-lavender": "#c791d7",
  "--colors-mint": "#6bb6c0",
  "--colors-sapphire": "#7fb6e4",
  "--colors-forest": "#88b369",
  "--colors-navy": "#519fdf",
  "--colors-plum": "#b568cd",
  "--colors-tangerine": "#ff9e64",
};

export function getMascotColor(colorIndex: number): string {
  const varName = MASCOT_COLOR_VARS[colorIndex % MASCOT_COLOR_VARS.length];
  const computed = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
  return computed || FALLBACKS[varName];
}
