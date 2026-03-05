import { css, cva } from "@styled-system/css";

export const FADE_OUT_MS = 300;

export const wrapper = css({
  pointerEvents: "none",
  flexShrink: 0,
  marginLeft: "6px",
  alignSelf: "flex-start",
});

export const bubble = css({
  pos: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  bg: "bg3",
  border: "0.5px solid token(colors.hairline)",
  borderRadius: "8px",
  padding: "0",
  w: "20px",
  h: "18px",
  shadow: "0 1px 2px rgba(0, 0, 0, 0.2)",
  whiteSpace: "nowrap",
  animation: "scale-in 200ms cubic-bezier(0.34, 1.56, 0.64, 1)",
  _after: {
    content: '""',
    pos: "absolute",
    left: "-3px",
    bottom: "3px",
    transform: "rotate(45deg)",
    w: "6px",
    h: "6px",
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
        fontSize: "11px",
        letterSpacing: "0.5px",
      },
      compacting: {
        color: "cyan",
        fontSize: "10px",
      },
      approval: {
        color: "red",
        fontSize: "11px",
        fontWeight: 700,
        animation: "bubble-blink 1s ease-in-out infinite",
      },
      input: {
        color: "green",
        fontSize: "11px",
        fontWeight: 700,
      },
      idle: {
        color: "yellow",
        fontSize: "9px",
        fontWeight: 700,
        fontStyle: "italic",
        animation: "zzz-float 2.5s ease-in-out infinite",
      },
    },
  },
});
