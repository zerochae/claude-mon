import { cx } from "@styled-system/css";
import {
  buttonRecipe,
  type Variant,
  type Size,
  type Color,
} from "./Button.styles";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  color?: Color;
  shape?: "default" | "round";
  active?: boolean;
}

export function Button({
  variant,
  size,
  color,
  shape,
  active,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cx(
        buttonRecipe({ variant, size, color, shape, active }),
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
