import { toggleThumb, toggleTrack } from "@/styles/Settings.styles";

interface ToggleProps {
  value: boolean;
  onChange: (v: boolean) => void;
}

export function Toggle({ value, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      className={toggleTrack}
      style={{
        background: value
          ? "var(--colors-green, #98c379)"
          : "var(--colors-comment, #565c64)",
      }}
      onClick={() => onChange(!value)}
    >
      <div className={toggleThumb} style={{ left: value ? "14px" : "2px" }} />
    </button>
  );
}
