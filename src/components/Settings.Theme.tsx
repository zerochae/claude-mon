import { Button } from "@/components/Button";
import type { AppSettings, ThemeName } from "@/hooks/useSettings";
import {
  checkMark,
  column,
  columnBody,
  columnHeader,
  PREVIEW_KEYS,
  previewBg,
  previewColor,
  previewStrip,
  themeButton,
  themeOptLabel,
  THEMES,
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
          const stripStyle = { border: `1px solid ${colors.border}` };
          return (
            <Button
              key={name}
              onClick={() => onUpdate({ theme: name })}
              className={themeButton({ active: isActive })}
            >
              <div className={previewStrip} style={stripStyle}>
                <div className={previewBg} style={{ background: colors.bg }} />
                {PREVIEW_KEYS.map((key) => (
                  <div
                    key={key}
                    className={previewColor}
                    style={{ background: colors[key] }}
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
