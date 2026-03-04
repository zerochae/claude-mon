import { css, cva } from "@styled-system/css";
import { DONE_PHASES } from "@/lib/phases";

export const STALE_THRESHOLD_SEC = 10;
export const DONE_VISIBLE_SEC = 4;
export const FADE_OUT_MS = 300;

export const SB_DONE_PHASES = new Set([...DONE_PHASES, "waiting_for_input" as const]);

export const phaseContent = cva({
  base: {
    fontFamily: "SpaceMonoNerd",
  },
  variants: {
    phase: {
      processing: {
        color: "orange",
        fontSize: "13px",
        letterSpacing: "1px",
      },
      compacting: {
        color: "cyan",
        fontSize: "11px",
      },
      approval: {
        color: "red",
        fontSize: "12px",
        fontWeight: 700,
        animation: "bubble-blink 1s ease-in-out infinite",
      },
      done: {
        color: "green",
        fontSize: "12px",
        fontWeight: 700,
      },
      idle: {
        color: "gray",
        fontSize: "9px",
        letterSpacing: "0.5px",
      },
    },
  },
});

export const bubbleWrapper = css({ pos: "relative" });

export const bubbleStyle = css({
  pos: "absolute",
  bottom: "100%",
  left: "50%",
  transform: "translateX(-50%)",
  mb: "6px",
  bg: "bg3",
  border: "0.5px solid token(colors.hairline)",
  borderRadius: "8px",
  padding: "3px 7px",
  whiteSpace: "nowrap",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minW: "24px",
  minH: "20px",
  shadow: "0 1px 3px rgba(0, 0, 0, 0.3), 0 4px 12px rgba(0, 0, 0, 0.15)",
  animation: "scale-in 200ms cubic-bezier(0.34, 1.56, 0.64, 1)",
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
