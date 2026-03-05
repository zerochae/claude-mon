import { css, cva } from "@styled-system/css";
import { DONE_PHASES } from "@/constants/phases";

export const STALE_THRESHOLD_SEC = 10;
export const DONE_VISIBLE_SEC = 4;
export const FADE_OUT_MS = 300;

export const SB_DONE_PHASES = new Set([
  ...DONE_PHASES,
  "waiting_for_input" as const,
]);

export const phaseContent = cva({
  base: {
    fontFamily: "SpaceMonoNerd",
  },
  variants: {
    phase: {
      processing: { color: "orange", letterSpacing: "0.5px" },
      compacting: { color: "cyan" },
      approval: {
        color: "red",
        fontWeight: 700,
        animation: "bubble-blink 1s ease-in-out infinite",
      },
      input: { color: "green", fontWeight: 700 },
      idle: {
        color: "yellow",
        fontWeight: 700,
        fontStyle: "italic",
        animation: "zzz-float 2.5s ease-in-out infinite",
      },
    },
    size: {
      lg: {},
      md: {},
      sm: {},
    },
  },
  compoundVariants: [
    { phase: "processing", size: "lg", css: { fontSize: "15px" } },
    { phase: "processing", size: "md", css: { fontSize: "13px", letterSpacing: "1px" } },
    { phase: "processing", size: "sm", css: { fontSize: "11px" } },
    { phase: "compacting", size: "lg", css: { fontSize: "13px" } },
    { phase: "compacting", size: "md", css: { fontSize: "11px" } },
    { phase: "compacting", size: "sm", css: { fontSize: "10px" } },
    { phase: "approval", size: "lg", css: { fontSize: "15px" } },
    { phase: "approval", size: "md", css: { fontSize: "12px" } },
    { phase: "approval", size: "sm", css: { fontSize: "11px" } },
    { phase: "input", size: "lg", css: { fontSize: "15px" } },
    { phase: "input", size: "md", css: { fontSize: "12px" } },
    { phase: "input", size: "sm", css: { fontSize: "11px" } },
    { phase: "idle", size: "lg", css: { fontSize: "11px" } },
    { phase: "idle", size: "md", css: { fontSize: "11px" } },
    { phase: "idle", size: "sm", css: { fontSize: "9px" } },
  ],
  defaultVariants: { size: "lg" },
});

const bubbleBase = {
  pos: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  bg: "bg3",
  border: "0.5px solid token(colors.hairline)",
  whiteSpace: "nowrap",
  animation: "scale-in 200ms cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;

export const wrapper = cva({
  base: {
    pointerEvents: "none",
    flexShrink: 0,
  },
  variants: {
    variant: {
      bar: { marginTop: "-20px", marginLeft: "4px" },
      chat: { marginLeft: "6px", alignSelf: "flex-start" },
      stage: { pos: "relative" },
    },
  },
});

export const bubble = cva({
  base: bubbleBase,
  variants: {
    variant: {
      bar: {
        borderRadius: "10px",
        padding: "0",
        w: "28px",
        h: "26px",
        shadow: "0 1px 3px rgba(0, 0, 0, 0.3)",
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
      },
      chat: {
        borderRadius: "8px",
        padding: "0",
        w: "20px",
        h: "18px",
        shadow: "0 1px 2px rgba(0, 0, 0, 0.2)",
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
      },
      stage: {
        pos: "absolute",
        bottom: "100%",
        left: "50%",
        transform: "translateX(-50%)",
        mb: "6px",
        borderRadius: "8px",
        padding: "3px 7px",
        minW: "24px",
        minH: "20px",
        shadow: "0 1px 3px rgba(0, 0, 0, 0.3), 0 4px 12px rgba(0, 0, 0, 0.15)",
      },
    },
  },
});

export const tailStyle = css({
  pos: "absolute",
  top: "100%",
  left: "50%",
  transform: "translateX(-50%)",
  w: 0,
  h: 0,
  borderLeft: "4px solid transparent",
  borderRight: "4px solid transparent",
  borderTop: "4px solid token(colors.bg3)",
});
