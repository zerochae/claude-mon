import { css } from "@styled-system/css";

import { FRAMES } from "@/constants/loading";

const wrapper = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flex: 1,
  userSelect: "none",
});

const glyphOuter = css({
  overflow: "hidden",
  height: "1em",
  lineHeight: "1em",
  fontFamily: "SpaceMonoNerd",
  fontSize: "24px",
  color: "var(--colors-magenta, #c678dd)",
});

const glyphStrip = css({
  animation: `glyph-strip 800ms steps(${FRAMES.length}) infinite`,
  willChange: "transform",
});

const glyphFrame = css({
  height: "1em",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
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
      <div className={glyphOuter}>
        <div className={glyphStrip}>
          {FRAMES.map((f, i) => (
            <div key={i} className={glyphFrame}>
              {f}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
