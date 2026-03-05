import type { ThemeName } from "@/hooks/useSettings";
import { THEMES } from "@/styles/Settings.styles";

export function getThemeColor(themeName: ThemeName, key: string): string {
  return THEMES.find((t) => t.name === themeName)?.colors[key] ?? "#888";
}
