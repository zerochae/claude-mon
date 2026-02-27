import { useState, useCallback, useRef } from "react";
import { css, cva } from "@styled-system/css";
import { MOTION } from "@/lib/motion";
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
} from "@/theme/colorscheme";
import type {
  AppSettings,
  ThemeName,
  WindowAnchor,
  DockPosition,
} from "@/hooks/useSettings";

interface SettingsViewProps {
  settings: AppSettings;
  onUpdate: (patch: Partial<AppSettings>) => void;
  onResetColors: () => void;
}

export const SETTINGS_WIDTH = 720;

const THEMES: {
  name: ThemeName;
  label: string;
  colors: Record<string, string>;
}[] = [
  { name: "onedark", label: "One Dark", colors: onedarkColors },
  { name: "tokyonight", label: "Tokyo Night", colors: tokyonightColors },
  { name: "nord", label: "Nord", colors: nordColors },
  { name: "ayudark", label: "Ayu Dark", colors: ayudarkColors },
  { name: "gruvboxdark", label: "Gruvbox Dark", colors: gruvboxdarkColors },
  { name: "githubdark", label: "GitHub Dark", colors: githubdarkColors },
  { name: "onelight", label: "One Light", colors: onelightColors },
  { name: "ayulight", label: "Ayu Light", colors: ayulightColors },
  { name: "gruvboxlight", label: "Gruvbox Light", colors: gruvboxlightColors },
  { name: "blossomlight", label: "Blossom Light", colors: blossomlightColors },
  { name: "githublight", label: "GitHub Light", colors: githublightColors },
];

const PREVIEW_KEYS = ["blue", "green", "red", "orange", "magenta", "cyan"];

const COLOR_OVERRIDE_KEYS = [
  { key: "bg", label: "BG" },
  { key: "text", label: "Text" },
  { key: "blue", label: "Blue" },
  { key: "green", label: "Green" },
  { key: "red", label: "Red" },
  { key: "yellow", label: "Yellow" },
  { key: "magenta", label: "Magenta" },
  { key: "cyan", label: "Cyan" },
  { key: "orange", label: "Orange" },
  { key: "comment", label: "Comment" },
];

const columnsContainer = css({
  display: "flex",
  flex: 1,
  overflow: "hidden",
  animation: "fade-in 150ms cubic-bezier(0.2, 0, 0, 1)",
});

const column = css({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  borderRight: "1px solid var(--colors-hairlineFaint, rgba(255,255,255,0.04))",
  _last: { borderRight: "none" },
});

const columnHeader = css({
  fontSize: "10px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "comment",
  padding: "6px 10px",
  flexShrink: 0,
});

const columnBody = css({
  flex: 1,
  overflowY: "auto",
});

const rowStyle = css({
  display: "flex",
  alignItems: "center",
  padding: "5px 10px",
  gap: "6px",
  fontSize: "11px",
  color: "text",
});

const rowLabel = css({
  flex: 1,
  fontSize: "11px",
  color: "text",
});

const scrollInputStyle = css({
  width: "52px",
  fontSize: "10px",
  color: "text",
  background: "transparent",
  border: "1px solid var(--colors-comment, #565c64)",
  borderRadius: "4px",
  padding: "3px 6px",
  textAlign: "right",
  outline: "none",
  _focus: { borderColor: "var(--colors-blue, #61afef)" },
});

const colorInput = css({
  width: "18px",
  height: "18px",
  padding: "0",
  border: "none",
  background: "transparent",
  cursor: "pointer",
  flexShrink: 0,
});

const hexInput = css({
  width: "58px",
  fontSize: "10px",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  color: "text",
  background: "transparent",
  border: "1px solid var(--colors-comment, #565c64)",
  borderRadius: "4px",
  padding: "3px 4px",
  outline: "none",
  _focus: { borderColor: "var(--colors-blue, #61afef)" },
});

const resetBtn = css({
  fontSize: "9px",
  color: "comment",
  cursor: "pointer",
  border: "none",
  background: "transparent",
  padding: "2px 4px",
  borderRadius: "3px",
  _hover: { bg: "surfaceHover", color: "text" },
});

const anchorGroup = css({
  display: "flex",
  gap: "2px",
  borderRadius: "4px",
  overflow: "hidden",
  border: "1px solid var(--colors-comment, #565c64)",
});

const anchorBtn = cva({
  base: {
    padding: "3px 8px",
    fontSize: "9px",
    border: "none",
    cursor: "pointer",
    color: "text",
    transition: "background 120ms ease",
    _hover: { bg: "surfaceHover" },
  },
  variants: {
    active: {
      true: { bg: "surfaceActive", fontWeight: 600 },
      false: { bg: "transparent", fontWeight: 400 },
    },
  },
  defaultVariants: { active: false },
});

const ANCHOR_OPTIONS: { value: WindowAnchor; label: string }[] = [
  { value: "top", label: "Top" },
  { value: "center", label: "Center" },
  { value: "bottom", label: "Bot" },
];

const VIBRANCY_OPTIONS = [
  { value: "none", label: "Off" },
  { value: "hud", label: "HUD" },
  { value: "popover", label: "Popover" },
  { value: "sidebar", label: "Sidebar" },
  { value: "menu", label: "Menu" },
  { value: "under_window", label: "Under Window" },
  { value: "window", label: "Window BG" },
  { value: "content", label: "Content BG" },
  { value: "header", label: "Header" },
  { value: "sheet", label: "Sheet" },
  { value: "titlebar", label: "Titlebar" },
  { value: "tooltip", label: "Tooltip" },
  { value: "fullscreen", label: "Fullscreen" },
];

const selectStyle = css({
  fontSize: "10px",
  color: "text",
  background: "transparent",
  border: "1px solid var(--colors-comment, #565c64)",
  borderRadius: "4px",
  padding: "3px 6px",
  outline: "none",
  cursor: "pointer",
  _focus: { borderColor: "var(--colors-blue, #61afef)" },
});

const DOCK_OPTIONS: { value: DockPosition; label: string }[] = [
  { value: "none", label: "Off" },
  { value: "top", label: "Top" },
  { value: "bottom", label: "Bot" },
];

const toggleTrack = css({
  width: "28px",
  height: "16px",
  borderRadius: "8px",
  cursor: "pointer",
  position: "relative",
  transition: "background 120ms ease",
  flexShrink: 0,
});

const toggleThumb = css({
  width: "12px",
  height: "12px",
  borderRadius: "50%",
  background: "white",
  position: "absolute",
  top: "2px",
  transition: "left 120ms ease",
});

const themeButton = cva({
  base: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    w: "100%",
    padding: "5px 10px",
    border: "none",
    cursor: "pointer",
    transition: MOTION.transition.color,
    _hover: { bg: "surfaceHover" },
  },
  variants: {
    active: {
      true: { bg: "surfaceActive", _hover: { bg: "surfaceActive" } },
      false: { bg: "transparent" },
    },
  },
  defaultVariants: { active: false },
});

const previewStrip = css({
  display: "flex",
  borderRadius: "3px",
  overflow: "hidden",
  flexShrink: 0,
});

const themeOptLabel = cva({
  base: { flex: 1, textAlign: "left", color: "text", fontSize: "11px" },
  variants: {
    active: { true: { fontWeight: 600 }, false: { fontWeight: 400 } },
  },
  defaultVariants: { active: false },
});

const checkMark = css({ color: "green", fontSize: "11px" });

function ScrollInput({
  value,
  onChange,
  min,
  max,
  step,
  suffix = "",
  width,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  width?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const clamp = useCallback(
    (v: number) => Math.min(max, Math.max(min, Math.round(v / step) * step)),
    [min, max, step],
  );

  const triggerShake = useCallback(() => {
    setShake(true);
    setTimeout(() => setShake(false), 300);
  }, []);

  const display = step < 1 ? value.toFixed(2) : String(value);

  return (
    <input
      ref={inputRef}
      className={scrollInputStyle}
      style={{
        ...(width ? { width } : {}),
        ...(shake
          ? {
              borderColor: "var(--colors-red, #E06C75)",
              animation: "shake 300ms ease",
            }
          : {}),
      }}
      value={editing ? draft : `${display}${suffix}`}
      onFocus={() => {
        setEditing(true);
        setDraft(display);
      }}
      onBlur={() => {
        setEditing(false);
        const parsed = parseFloat(draft);
        if (!isNaN(parsed)) {
          if (parsed < min || parsed > max) triggerShake();
          onChange(clamp(parsed));
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") {
          setEditing(false);
          setDraft(display);
          (e.target as HTMLInputElement).blur();
        }
      }}
      onChange={(e) => setDraft(e.target.value)}
      onWheel={(e) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? step : -step;
        const raw = value + delta;
        if (raw < min || raw > max) {
          triggerShake();
          return;
        }
        onChange(clamp(raw));
      }}
    />
  );
}

function Toggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      className={toggleTrack}
      style={{
        background: value
          ? "var(--colors-green, #98c379)"
          : "var(--colors-comment, #565c64)",
      }}
      onClick={() => onChange(!value)}
    >
      <div className={toggleThumb} style={{ left: value ? "14px" : "2px" }} />
    </div>
  );
}

function getThemeColor(themeName: ThemeName, key: string): string {
  return THEMES.find((t) => t.name === themeName)?.colors[key] ?? "#888";
}

export function SettingsView({
  settings,
  onUpdate,
  onResetColors,
}: SettingsViewProps) {
  const hasOverrides = Object.keys(settings.colorOverrides).length > 0;

  return (
    <div className={columnsContainer}>
      {/* Theme Column */}
      <div className={column}>
        <div className={columnHeader}>Theme</div>
        <div className={columnBody}>
          {THEMES.map(({ name, label, colors }) => {
            const isActive = name === settings.theme;
            return (
              <button
                key={name}
                onClick={() => onUpdate({ theme: name })}
                className={themeButton({ active: isActive })}
              >
                <div
                  className={previewStrip}
                  style={{ border: `1px solid ${colors.border}` }}
                >
                  <div
                    style={{ width: 10, height: 16, background: colors.bg }}
                  />
                  {PREVIEW_KEYS.map((key) => (
                    <div
                      key={key}
                      style={{ width: 7, height: 16, background: colors[key] }}
                    />
                  ))}
                </div>
                <span className={themeOptLabel({ active: isActive })}>
                  {label}
                </span>
                {isActive && <span className={checkMark}>&#10003;</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Color Column */}
      <div className={column}>
        <div className={columnHeader}>Color</div>
        <div className={columnBody}>
          {COLOR_OVERRIDE_KEYS.map(({ key, label }) => {
            const current =
              settings.colorOverrides[key] ||
              getThemeColor(settings.theme, key);
            const isOverridden = key in settings.colorOverrides;
            return (
              <div key={key} className={rowStyle}>
                <span className={rowLabel}>
                  {label}
                  {isOverridden && (
                    <span
                      style={{
                        color: "var(--colors-orange)",
                        marginLeft: 3,
                        fontSize: "9px",
                      }}
                    >
                      *
                    </span>
                  )}
                </span>
                <input
                  type="color"
                  className={colorInput}
                  value={current}
                  onChange={(e) => {
                    onUpdate({
                      colorOverrides: {
                        ...settings.colorOverrides,
                        [key]: e.target.value,
                      },
                    });
                  }}
                />
                <input
                  className={hexInput}
                  value={current}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
                      onUpdate({
                        colorOverrides: {
                          ...settings.colorOverrides,
                          [key]: v,
                        },
                      });
                    }
                  }}
                  onBlur={(e) => {
                    let v = e.target.value.trim();
                    if (!v.startsWith("#")) v = "#" + v;
                    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
                      onUpdate({
                        colorOverrides: {
                          ...settings.colorOverrides,
                          [key]: v,
                        },
                      });
                    }
                  }}
                />
                {isOverridden && (
                  <button
                    className={resetBtn}
                    onClick={() => {
                      const next = { ...settings.colorOverrides };
                      Reflect.deleteProperty(next, key);
                      onUpdate({ colorOverrides: next });
                    }}
                  >
                    &#10005;
                  </button>
                )}
              </div>
            );
          })}
          {hasOverrides && (
            <div className={rowStyle}>
              <span className={rowLabel} />
              <button className={resetBtn} onClick={onResetColors}>
                Reset All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Appearance Column */}
      <div className={column}>
        <div className={columnHeader}>Appearance</div>
        <div className={columnBody}>
          <div className={rowStyle}>
            <span className={rowLabel}>Border</span>
            <Toggle
              value={settings.border.enabled}
              onChange={(v) =>
                onUpdate({ border: { ...settings.border, enabled: v } })
              }
            />
          </div>
          {settings.border.enabled && (
            <div className={rowStyle}>
              <span className={rowLabel}>Radius</span>
              <ScrollInput
                value={settings.border.radius}
                onChange={(v) =>
                  onUpdate({ border: { ...settings.border, radius: v } })
                }
                min={0}
                max={16}
                step={1}
                suffix="px"
              />
            </div>
          )}
          <div className={rowStyle}>
            <span className={rowLabel}>Opacity</span>
            <ScrollInput
              value={settings.opacity}
              onChange={(v) => onUpdate({ opacity: v })}
              min={0.5}
              max={1}
              step={0.05}
            />
          </div>
          <div className={rowStyle}>
            <span className={rowLabel}>Vibrancy</span>
            <select
              className={selectStyle}
              value={settings.vibrancy}
              onChange={(e) => onUpdate({ vibrancy: e.target.value })}
            >
              {VIBRANCY_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className={rowStyle}>
            <span className={rowLabel}>Font Size</span>
            <ScrollInput
              value={settings.fontSize}
              onChange={(v) => onUpdate({ fontSize: v })}
              min={10}
              max={16}
              step={1}
              suffix="px"
            />
          </div>
        </div>
      </div>

      {/* Window Column */}
      <div className={column}>
        <div className={columnHeader}>Window</div>
        <div className={columnBody}>
          <div className={rowStyle}>
            <span className={rowLabel}>Width</span>
            <ScrollInput
              value={settings.windowWidth}
              onChange={(v) => onUpdate({ windowWidth: v })}
              min={320}
              max={640}
              step={10}
              suffix="px"
            />
          </div>
          <div className={rowStyle}>
            <span className={rowLabel}>Bar Height</span>
            <ScrollInput
              value={settings.barHeight}
              onChange={(v) => onUpdate({ barHeight: v })}
              min={32}
              max={80}
              step={2}
              suffix="px"
            />
          </div>
          <div className={rowStyle}>
            <span className={rowLabel}>Anchor</span>
            <div className={anchorGroup}>
              {ANCHOR_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  className={anchorBtn({ active: settings.anchor === value })}
                  onClick={() => onUpdate({ anchor: value })}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className={rowStyle}>
            <span className={rowLabel}>Dock</span>
            <div className={anchorGroup}>
              {DOCK_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  className={anchorBtn({ active: settings.dock === value })}
                  onClick={() => onUpdate({ dock: value })}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {settings.dock !== "none" && (
            <div className={rowStyle}>
              <span className={rowLabel}>Margin</span>
              <ScrollInput
                value={settings.dockMargin}
                onChange={(v) => onUpdate({ dockMargin: v })}
                min={0}
                max={200}
                step={2}
                suffix="px"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
