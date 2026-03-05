import { useState, useCallback, useRef } from "react";
import type { AppSettings, ThemeName } from "@/hooks/useSettings";
import {
  VIEW_WIDTH_ITEMS,
  THEMES,
  PREVIEW_KEYS,
  COLOR_OVERRIDE_KEYS,
  ANCHOR_OPTIONS,
  VIBRANCY_OPTIONS,
  DOCK_OPTIONS,
  columnsContainer,
  column,
  columnHeader,
  columnBody,
  rowStyle,
  rowLabel,
  scrollInputStyle,
  colorInput,
  hexInput,
  resetBtn,
  anchorGroup,
  anchorBtn,
  selectStyle,
  toggleTrack,
  toggleThumb,
  themeButton,
  previewStrip,
  themeOptLabel,
  checkMark,
} from "@/styles/Settings.styles";

interface SettingsProps {
  settings: AppSettings;
  onUpdate: (patch: Partial<AppSettings>) => void;
  onResetColors: () => void;
}

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

export function Settings({
  settings,
  onUpdate,
  onResetColors,
}: SettingsProps) {
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
          {VIEW_WIDTH_ITEMS.map(({ key, label }) => (
            <div key={key} className={rowStyle}>
              <span className={rowLabel}>{label}</span>
              <ScrollInput
                value={settings.viewWidths[key]}
                onChange={(v) =>
                  onUpdate({ viewWidths: { ...settings.viewWidths, [key]: v } })
                }
                min={320}
                max={800}
                step={10}
                suffix="px"
              />
            </div>
          ))}
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
          <div className={rowStyle}>
            <span className={rowLabel}>Hide from Dock</span>
            <button
              className={anchorBtn({ active: settings.accessoryMode })}
              onClick={() =>
                onUpdate({ accessoryMode: !settings.accessoryMode })
              }
            >
              {settings.accessoryMode ? "On" : "Off"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
