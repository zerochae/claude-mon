export type BubbleVariant = "bar" | "chat" | "stage";
export type BubbleSize = "lg" | "md" | "sm";

export const VARIANT_SIZE: Record<BubbleVariant, BubbleSize> = {
  bar: "lg",
  chat: "sm",
  stage: "md",
};
