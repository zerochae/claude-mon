import { css } from "@styled-system/css";

const FRAMES = ["󰪞", "󰪟", "󰪠", "󰪢", "󰪣", "󰪤", "󰪥"];

const wrapper = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flex: 1,
  userSelect: "none",
});

export function Loading() {
  return (
    <div className={wrapper}>
      <style>{`
        @keyframes glyph-strip {
          0% { transform: translateY(0); }
          100% { transform: translateY(-${FRAMES.length}em); }
        }
      `}</style>
      <div
        style={{
          overflow: "hidden",
          height: "1em",
          lineHeight: "1em",
          fontFamily: "SpaceMonoNerd",
          fontSize: "24px",
          color: "var(--colors-magenta, #c678dd)",
        }}
      >
        <div
          style={{
            animation: `glyph-strip 800ms steps(${FRAMES.length}) infinite`,
            willChange: "transform",
          }}
        >
          {FRAMES.map((f, i) => (
            <div
              key={i}
              style={{
                height: "1em",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {f}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
