import { useCallback, useRef, useState } from "react";

import { scrollInputStyle } from "@/styles/Settings.styles";

interface ScrollInputProps {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  width?: string;
}

export function ScrollInput({
  value,
  onChange,
  min,
  max,
  step,
  suffix = "",
  width,
}: ScrollInputProps) {
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
