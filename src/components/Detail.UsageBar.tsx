import { formatResetCountdown } from "@/hooks/useClaudeUsage";
import {
  usageBar,
  usageBarSpread,
  usageFill,
  usageLabel,
  usageMuted,
  usageRow,
  usageText,
} from "@/styles/Detail.styles";

export function UsageBarRow({
  label,
  pct,
  resetIso,
}: {
  label: string;
  pct: number;
  resetIso: string | null;
}) {
  const clamped = Math.min(100, Math.max(0, pct));
  const resetStr = formatResetCountdown(resetIso);
  return (
    <div className={usageRow}>
      <div className={usageBarSpread}>
        <span className={usageLabel}>{label}</span>
        <span className={usageText}>{Math.round(clamped)}% used</span>
      </div>
      <div className={usageBar}>
        <div
          className={usageFill}
          style={{
            width: `${clamped}%`,
            background:
              clamped >= 80
                ? "var(--colors-red)"
                : clamped >= 50
                  ? "var(--colors-yellow)"
                  : "var(--colors-green)",
          }}
        />
      </div>
      {resetStr && <span className={usageMuted}>Resets in {resetStr}</span>}
    </div>
  );
}
