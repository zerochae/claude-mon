export const MOTION = {
  duration: {
    instant: "80ms",
    fast: "120ms",
    normal: "200ms",
    slow: "350ms",
  },
  easing: {
    default: "cubic-bezier(0.2, 0, 0, 1)",
    spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    exit: "cubic-bezier(0.4, 0, 1, 1)",
    enter: "cubic-bezier(0, 0, 0.2, 1)",
  },
  transition: {
    button:
      "transform 80ms cubic-bezier(0.2, 0, 0, 1), background 120ms cubic-bezier(0.2, 0, 0, 1), color 120ms cubic-bezier(0.2, 0, 0, 1), box-shadow 120ms cubic-bezier(0.2, 0, 0, 1)",
    color:
      "color 120ms cubic-bezier(0.2, 0, 0, 1), background 120ms cubic-bezier(0.2, 0, 0, 1)",
    viewEnter: "view-enter 200ms cubic-bezier(0.34, 1.56, 0.64, 1)",
    scaleIn: "scale-in 200ms cubic-bezier(0.34, 1.56, 0.64, 1)",
  },
} as const;
