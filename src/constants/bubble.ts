export type BubbleVariant = "bar" | "chat" | "stage";
type BubbleSize = "lg" | "md" | "sm";

export const VARIANT_SIZE: Record<BubbleVariant, BubbleSize> = {
  bar: "lg",
  chat: "sm",
  stage: "md",
};
