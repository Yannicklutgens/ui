import { ButtonHTMLAttributes, FocusEvent, MouseEvent, forwardRef } from "react";
import { Icon, IconType, resolveColor } from "./Icon";
import { useTooltip } from "./useTooltip";

export type ButtonVariant = "default" | "primary" | "danger" | "link";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Icon name (or custom path, see Icon). Without children the button becomes icon-only and needs a label or aria-label. */
  icon?: string;
  iconType?: IconType;
  iconPosition?: "start" | "end";
  /** No border or background until hover. */
  borderless?: boolean;
  /** Text and icon colour: any CSS colour or a token (accent, danger, success, warning, muted, faint). */
  color?: string;
  /** Text shown in a tooltip on hover and focus (not while disabled). Also the default aria-label of an icon-only button. */
  label?: string;
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
    label,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur,
    ...rest
  },
  ref,
) {
  const hasChildren = children !== undefined && children !== null && children !== false && children !== "";
  const iconOnly = !!icon && !hasChildren;
  const ariaLabel = rest["aria-label"] ?? (iconOnly ? label : undefined);
  const { triggerProps, bubble } = useTooltip(label);

  if (iconOnly && !ariaLabel) {
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
    <>
      <button
        ref={ref}
        className={classes || undefined}
        style={color ? { color: resolveColor(color), ...style } : style}
        title={title ?? (iconOnly && !label ? ariaLabel : undefined)}
        {...rest}
        aria-label={ariaLabel}
        onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => {
          if (label) triggerProps.onMouseEnter(e);
          onMouseEnter?.(e);
        }}
        onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => {
          if (label) triggerProps.onMouseLeave();
          onMouseLeave?.(e);
        }}
        onFocus={(e: FocusEvent<HTMLButtonElement>) => {
          if (label) triggerProps.onFocus(e);
          onFocus?.(e);
        }}
        onBlur={(e: FocusEvent<HTMLButtonElement>) => {
          if (label) triggerProps.onBlur();
          onBlur?.(e);
        }}
      >
        {iconPosition === "start" && iconElement}
        {children}
        {iconPosition === "end" && iconElement}
      </button>
      {bubble}
    </>
  );
});
