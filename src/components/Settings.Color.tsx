import type { AppSettings, ThemeName } from "@/hooks/useSettings";
import { Button } from "@/components/Button";
import { getThemeColor } from "@/utils/settings.utils";
import {
  COLOR_OVERRIDE_KEYS,
  column,
  columnHeader,
  columnBody,
  rowStyle,
  rowLabel,
  colorInput,
  hexInput,
  resetBtn,
} from "@/styles/Settings.styles";

interface SettingsColorProps {
  theme: ThemeName;
  colorOverrides: AppSettings["colorOverrides"];
  onUpdate: (patch: Partial<AppSettings>) => void;
  onResetColors: () => void;
}

export function SettingsColor({
  theme,
  colorOverrides,
  onUpdate,
  onResetColors,
}: SettingsColorProps) {
  const hasOverrides = Object.keys(colorOverrides).length > 0;

  return (
    <div className={column}>
      <div className={columnHeader}>Color</div>
      <div className={columnBody}>
        {COLOR_OVERRIDE_KEYS.map(({ key, label }) => {
          const current = colorOverrides[key] || getThemeColor(theme, key);
          const isOverridden = key in colorOverrides;
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
                      ...colorOverrides,
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
                        ...colorOverrides,
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
                        ...colorOverrides,
                        [key]: v,
                      },
                    });
                  }
                }}
              />
              {isOverridden && (
                <Button
                  className={resetBtn}
                  onClick={() => {
                    const next = { ...colorOverrides };
                    Reflect.deleteProperty(next, key);
                    onUpdate({ colorOverrides: next });
                  }}
                >
                  &#10005;
                </Button>
              )}
            </div>
          );
        })}
        {hasOverrides && (
          <div className={rowStyle}>
            <span className={rowLabel} />
            <Button className={resetBtn} onClick={onResetColors}>
              Reset All
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
