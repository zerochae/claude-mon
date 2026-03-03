import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getTheme, injectTheme, type ThemeName } from "@styled-system/themes";
import { setVibrancy } from "@/lib/tauri";

export type { ThemeName };

export type WindowAnchor = "top" | "center" | "bottom";
export type DockPosition = "none" | "top" | "bottom";

export interface ViewWidths {
  bar: number;
  house: number;
  chat: number;
  settings: number;
}

export interface AppSettings {
  theme: ThemeName;
  colorOverrides: Record<string, string>;
  border: { enabled: boolean; radius: number };
  opacity: number;
  bgBlur: number;
  vibrancy: string;
  fontSize: number;
  viewWidths: ViewWidths;
  barHeight: number;
  anchor: WindowAnchor;
  dock: DockPosition;
  dockMargin: number;
  accessoryMode: boolean;
}

export const DEFAULT_VIEW_WIDTHS: ViewWidths = {
  bar: 480,
  house: 480,
  chat: 480,
  settings: 720,
};

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "onedark",
  colorOverrides: {},
  border: { enabled: false, radius: 8 },
  opacity: 1.0,
  bgBlur: 0,
  vibrancy: "none",
  fontSize: 12,
  viewWidths: { ...DEFAULT_VIEW_WIDTHS },
  barHeight: 48,
  anchor: "center",
  dock: "none",
  dockMargin: 0,
  accessoryMode: true,
};

const COLOR_VAR_MAP: Record<string, string> = {
  bg: "--colors-bg",
  text: "--colors-text",
  blue: "--colors-blue",
  green: "--colors-green",
  red: "--colors-red",
  yellow: "--colors-yellow",
  magenta: "--colors-magenta",
  cyan: "--colors-cyan",
  orange: "--colors-orange",
  comment: "--colors-comment",
};

function applyColorOverrides(overrides: Record<string, string>) {
  const root = document.documentElement;
  for (const [key, cssVar] of Object.entries(COLOR_VAR_MAP)) {
    if (overrides[key]) {
      root.style.setProperty(cssVar, overrides[key]);
    } else {
      root.style.removeProperty(cssVar);
    }
  }
}

function applyAppearance(settings: AppSettings) {
  const container = document.querySelector<HTMLElement>(".widget-container");
  if (!container) return;

  container.style.opacity = String(settings.opacity);
  const blurPx = Math.round(settings.bgBlur * 50);
  container.style.backdropFilter = blurPx > 0 ? `blur(${blurPx}px)` : "";
  container.style.setProperty(
    "-webkit-backdrop-filter",
    blurPx > 0 ? `blur(${blurPx}px)` : "",
  );

  if (settings.border.enabled) {
    container.style.border =
      "1px solid var(--colors-border, rgba(255,255,255,0.15))";
    container.style.borderRadius = `${settings.border.radius}px`;
  } else {
    container.style.border = "";
    container.style.borderRadius = "";
  }

  document.documentElement.style.setProperty(
    "--app-font-size",
    `${settings.fontSize}px`,
  );

  setVibrancy(settings.vibrancy).catch(() => undefined);
  invoke("set_accessory_mode", { enabled: settings.accessoryMode }).catch(() => undefined);
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    invoke<string>("load_settings")
      .then((json) => {
        try {
          const raw = JSON.parse(json) as Record<string, unknown>;
          if ("windowWidth" in raw && !("viewWidths" in raw)) {
            const w = raw.windowWidth as number;
            raw.viewWidths = { ...DEFAULT_VIEW_WIDTHS, bar: w, house: w, chat: w };
            delete raw.windowWidth;
          }
          const saved = raw as Partial<AppSettings>;
          const merged = { ...DEFAULT_SETTINGS, ...saved };
          if (saved.viewWidths) {
            merged.viewWidths = { ...DEFAULT_VIEW_WIDTHS, ...saved.viewWidths };
          }
          setSettings(merged);
        } catch {
          setSettings(DEFAULT_SETTINGS);
        }
      })
      .catch(() => setSettings(DEFAULT_SETTINGS))
      .finally(() => setLoaded(true));
  }, []);

  const persistSettings = useCallback((s: AppSettings) => {
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      invoke("save_settings", { json: JSON.stringify(s) }).catch(
        () => undefined,
      );
    }, 500);
  }, []);

  const applyTheme = useCallback(async (name: ThemeName) => {
    const el = document.documentElement;
    const themeData = await getTheme(name);
    injectTheme(el, themeData);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    void applyTheme(settings.theme);
    applyColorOverrides(settings.colorOverrides);
    applyAppearance(settings);
  }, [loaded, settings, applyTheme]);

  const updateSettings = useCallback(
    (patch: Partial<AppSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch };
        persistSettings(next);
        return next;
      });
    },
    [persistSettings],
  );

  const resetColorOverrides = useCallback(() => {
    updateSettings({ colorOverrides: {} });
  }, [updateSettings]);

  return { settings, updateSettings, resetColorOverrides, loaded };
}
