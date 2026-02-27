const MASCOT_COLOR_VARS = [
  "--colors-orange",
  "--colors-magenta",
  "--colors-green",
  "--colors-red",
  "--colors-blue",
  "--colors-yellow",
  "--colors-cyan",
] as const;

const FALLBACKS: Record<string, string> = {
  "--colors-orange": "#d19a66",
  "--colors-magenta": "#c678dd",
  "--colors-green": "#98c379",
  "--colors-red": "#E06C75",
  "--colors-blue": "#61afef",
  "--colors-yellow": "#e5c07b",
  "--colors-cyan": "#56b6c2",
};

export function getMascotColor(colorIndex: number): string {
  const varName = MASCOT_COLOR_VARS[colorIndex % MASCOT_COLOR_VARS.length];
  const computed = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
  return computed || FALLBACKS[varName];
}
