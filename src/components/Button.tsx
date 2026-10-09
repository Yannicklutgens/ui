import { ButtonHTMLAttributes, forwardRef } from "react";
import { Icon, IconType, resolveColor } from "./Icon";

export type ButtonVariant = "default" | "primary" | "danger" | "link";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Icon name (or custom path, see Icon). Without children the button becomes icon-only and needs an aria-label. */
  icon?: string;
  iconType?: IconType;
  iconPosition?: "start" | "end";
  /** No border or background until hover. */
  borderless?: boolean;
  /** Text and icon colour: any CSS colour or a token (accent, danger, success, warning, muted, faint). */
  color?: string;
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  default: "",
  primary: "btn-primary",
  danger: "btn-danger",
  link: "btn-link",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "default",
    icon,
    iconType,
    iconPosition = "start",
    borderless,
    color,
    className,
    style,
    children,
    title,
    ...rest
  },
  ref,
) {
  const hasChildren = children !== undefined && children !== null && children !== false && children !== "";
  const iconOnly = !!icon && !hasChildren;

  if (iconOnly && !rest["aria-label"]) {
    console.warn(`Button: icon-only button "${icon}" has no aria-label`);
  }

  const classes = [
    VARIANT_CLASS[variant],
    icon ? (iconOnly ? "btn-icon" : "btn-with-icon") : "",
    borderless ? "btn-borderless" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const iconElement = icon && <Icon name={icon} type={iconType} />;

  return (
    <button
      ref={ref}
      className={classes || undefined}
      style={color ? { color: resolveColor(color), ...style } : style}
      title={title ?? (iconOnly ? rest["aria-label"] : undefined)}
      {...rest}
    >
      {iconPosition === "start" && iconElement}
      {children}
      {iconPosition === "end" && iconElement}
    </button>
  );
});
