import { css, cva } from "@styled-system/css";

export const FADE_OUT_MS = 300;

export const wrapper = css({
  pointerEvents: "none",
  flexShrink: 0,
  marginTop: "-20px",
  marginLeft: "4px",
});

export const bubble = css({
  pos: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  bg: "bg3",
  border: "0.5px solid token(colors.hairline)",
  borderRadius: "10px",
  padding: "0",
  w: "28px",
  h: "26px",
  shadow: "0 1px 3px rgba(0, 0, 0, 0.3)",
  whiteSpace: "nowrap",
  animation: "scale-in 200ms cubic-bezier(0.34, 1.56, 0.64, 1)",
  _after: {
    content: '""',
    pos: "absolute",
    left: "-4px",
    top: "4px",
    transform: "rotate(45deg)",
    w: "8px",
    h: "8px",
    bg: "bg3",
    borderRadius: "1px",
  },
});

export const phaseContent = cva({
  base: {
    fontFamily: "SpaceMonoNerd",
  },
  variants: {
    phase: {
      processing: {
        color: "orange",
        fontSize: "15px",
        letterSpacing: "0.5px",
      },
      compacting: {
        color: "cyan",
        fontSize: "13px",
      },
      approval: {
        color: "red",
        fontSize: "15px",
        fontWeight: 700,
        animation: "bubble-blink 1s ease-in-out infinite",
      },
      input: {
        color: "green",
        fontSize: "15px",
        fontWeight: 700,
      },
      idle: {
        color: "yellow",
        fontSize: "11px",
        fontWeight: 700,
        fontStyle: "italic",
        animation: "zzz-float 2.5s ease-in-out infinite",
      },
    },
  },
});
