import type { AppSettings } from "@/hooks/useSettings";
import { SettingsTheme } from "@/components/Settings.Theme";
import { SettingsColor } from "@/components/Settings.Color";
import { SettingsAppearance } from "@/components/Settings.Appearance";
import { SettingsWindow } from "@/components/Settings.Window";
import { columnsContainer } from "@/styles/Settings.styles";

interface SettingsProps {
  settings: AppSettings;
  onUpdate: (patch: Partial<AppSettings>) => void;
  onResetColors: () => void;
}

export function Settings({ settings, onUpdate, onResetColors }: SettingsProps) {
  return (
    <div className={columnsContainer}>
      <SettingsTheme theme={settings.theme} onUpdate={onUpdate} />
      <SettingsColor
        theme={settings.theme}
        colorOverrides={settings.colorOverrides}
        onUpdate={onUpdate}
        onResetColors={onResetColors}
      />
      <SettingsAppearance settings={settings} onUpdate={onUpdate} />
      <SettingsWindow settings={settings} onUpdate={onUpdate} />
    </div>
  );
}
