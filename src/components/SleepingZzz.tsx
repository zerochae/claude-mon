import { css } from "@styled-system/css";

const row = css({
  display: "flex",
  alignItems: "flex-end",
  gap: "1px",
});

const z = css({
  color: "white",
  fontWeight: 700,
  fontStyle: "italic",
  opacity: 0.9,
  animation: "zzz-float 2.5s ease-in-out infinite",
  lineHeight: 1,
});

const zStyles: Record<"sm" | "md", [string, string, string]> = {
  sm: [
    css({ fontSize: "6px", animationDelay: "0s" }),
    css({ fontSize: "8px", animationDelay: "0.4s" }),
    css({ fontSize: "10px", animationDelay: "0.8s" }),
  ],
  md: [
    css({ fontSize: "7px", animationDelay: "0s" }),
    css({ fontSize: "9px", animationDelay: "0.4s" }),
    css({ fontSize: "11px", animationDelay: "0.8s" }),
  ],
};

interface SleepingZzzProps {
  size?: "sm" | "md";
}

export function SleepingZzz({ size = "md" }: SleepingZzzProps) {
  const [c1, c2, c3] = zStyles[size];
  return (
    <div className={row}>
      <span className={`${z} ${c1}`}>z</span>
      <span className={`${z} ${c2}`}>z</span>
      <span className={`${z} ${c3}`}>z</span>
    </div>
  );
}
