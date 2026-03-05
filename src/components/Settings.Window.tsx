import type { AppSettings } from "@/hooks/useSettings";
import { Button } from "@/components/Button";
import { ScrollInput } from "@/components/Settings.ScrollInput";
import {
  VIEW_WIDTH_ITEMS,
  ANCHOR_OPTIONS,
  DOCK_OPTIONS,
  column,
  columnHeader,
  columnBody,
  rowStyle,
  rowLabel,
  anchorGroup,
  anchorBtn,
} from "@/styles/Settings.styles";

interface SettingsWindowProps {
  settings: AppSettings;
  onUpdate: (patch: Partial<AppSettings>) => void;
}

export function SettingsWindow({ settings, onUpdate }: SettingsWindowProps) {
  return (
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
              <Button
                key={value}
                className={anchorBtn({ active: settings.anchor === value })}
                onClick={() => onUpdate({ anchor: value })}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
        <div className={rowStyle}>
          <span className={rowLabel}>Dock</span>
          <div className={anchorGroup}>
            {DOCK_OPTIONS.map(({ value, label }) => (
              <Button
                key={value}
                className={anchorBtn({ active: settings.dock === value })}
                onClick={() => onUpdate({ dock: value })}
              >
                {label}
              </Button>
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
          <Button
            className={anchorBtn({ active: settings.accessoryMode })}
            onClick={() =>
              onUpdate({ accessoryMode: !settings.accessoryMode })
            }
          >
            {settings.accessoryMode ? "On" : "Off"}
          </Button>
        </div>
      </div>
    </div>
  );
}
