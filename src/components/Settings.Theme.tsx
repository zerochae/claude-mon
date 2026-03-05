import type { AppSettings, ThemeName } from "@/hooks/useSettings";
import { Button } from "@/components/Button";
import {
  THEMES,
  PREVIEW_KEYS,
  column,
  columnHeader,
  columnBody,
  themeButton,
  previewStrip,
  themeOptLabel,
  checkMark,
} from "@/styles/Settings.styles";

interface SettingsThemeProps {
  theme: ThemeName;
  onUpdate: (patch: Partial<AppSettings>) => void;
}

export function SettingsTheme({ theme, onUpdate }: SettingsThemeProps) {
  return (
    <div className={column}>
      <div className={columnHeader}>Theme</div>
      <div className={columnBody}>
        {THEMES.map(({ name, label, colors }) => {
          const isActive = name === theme;
          return (
            <Button
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
            </Button>
          );
        })}
      </div>
    </div>
  );
}
