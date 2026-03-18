import { ScrollInput } from "@/components/Settings.ScrollInput";
import { Toggle } from "@/components/Settings.Toggle";
import type { AppSettings } from "@/hooks/useSettings";
import {
  column,
  columnBody,
  columnHeader,
  rowLabel,
  rowStyle,
  selectStyle,
  VIBRANCY_OPTIONS,
} from "@/styles/Settings.styles";

interface SettingsAppearanceProps {
  settings: AppSettings;
  onUpdate: (patch: Partial<AppSettings>) => void;
}

export function SettingsAppearance({
  settings,
  onUpdate,
}: SettingsAppearanceProps) {
  return (
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
        <div className={rowStyle}>
          <span className={rowLabel}>Clawd Animation</span>
          <Toggle
            value={settings.clawdAnimation}
            onChange={(v) => onUpdate({ clawdAnimation: v })}
          />
        </div>
      </div>
    </div>
  );
}
