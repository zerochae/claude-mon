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

interface SleepingZzzProps {
  size?: "sm" | "md";
}

const SIZES = {
  sm: [6, 8, 10],
  md: [7, 9, 11],
};

export function SleepingZzz({ size = "md" }: SleepingZzzProps) {
  const [s1, s2, s3] = SIZES[size];
  return (
    <div className={row}>
      <span className={z} style={{ fontSize: `${s1}px`, animationDelay: "0s" }}>
        z
      </span>
      <span
        className={z}
        style={{ fontSize: `${s2}px`, animationDelay: "0.4s" }}
      >
        z
      </span>
      <span
        className={z}
        style={{ fontSize: `${s3}px`, animationDelay: "0.8s" }}
      >
        z
      </span>
    </div>
  );
}
