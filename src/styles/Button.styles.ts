import { cva } from "@styled-system/css";
import { MOTION } from "@/constants/motion";

export type Variant = "ghost" | "solid" | "outline";
export type Size = "icon" | "sm" | "md";
export type Color = "default" | "primary" | "success" | "danger";

export const buttonRecipe = cva({
  base: {
    border: "none",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    lineHeight: 1,
    fontFamily: "inherit",
    transition: MOTION.transition.button,
    _active: { transform: "scale(0.92)" },
    _disabled: {
      opacity: 0.4,
      cursor: "default",
      _active: { transform: "none" },
    },
  },
  variants: {
    variant: {
      ghost: {
        bg: "transparent",
        color: "comment",
        _hover: { bg: "surfaceHover", color: "text" },
      },
      solid: {
        fontWeight: 600,
      },
      outline: {
        bg: "transparent",
        borderWidth: "0.5px",
        borderStyle: "solid",
        borderColor: "hairline",
        color: "comment",
        _hover: { bg: "surfaceHover", color: "text" },
      },
    },
    size: {
      icon: {
        w: "24px",
        h: "24px",
        borderRadius: "6px",
        p: 0,
      },
      sm: {
        h: "26px",
        px: "8px",
        fontSize: "11px",
        borderRadius: "6px",
        gap: "4px",
      },
      md: {
        h: "32px",
        px: "12px",
        fontSize: "13px",
        borderRadius: "6px",
        gap: "6px",
      },
    },
    color: {
      default: {},
      primary: {},
      success: {},
      danger: {},
    },
    shape: {
      default: {},
      round: { borderRadius: "50%" },
    },
    active: {
      true: {},
      false: {},
    },
  },
  compoundVariants: [
    { variant: "ghost", active: true, css: { bg: "bg3", color: "text" } },
    {
      variant: "solid",
      color: "default",
      css: {
        bg: "bg3",
        color: "comment",
        _hover: { filter: "brightness(1.15)" },
      },
    },
    {
      variant: "solid",
      color: "primary",
      css: { bg: "blue", color: "bg", _hover: { filter: "brightness(1.1)" } },
    },
    {
      variant: "solid",
      color: "success",
      css: { bg: "green", color: "bg", _hover: { filter: "brightness(1.1)" } },
    },
    {
      variant: "solid",
      color: "danger",
      css: { bg: "red", color: "bg", _hover: { filter: "brightness(1.1)" } },
    },
  ],
  defaultVariants: {
    variant: "ghost",
    size: "icon",
    color: "default",
    shape: "default",
    active: false,
  },
});
