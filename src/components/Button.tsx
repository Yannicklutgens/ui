import { ButtonHTMLAttributes, forwardRef } from "react";

export type ButtonVariant = "default" | "primary" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  default: "",
  primary: "btn-primary",
  danger: "btn-danger",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "default", className, ...rest },
  ref,
) {
  const classes = [VARIANT_CLASS[variant], className].filter(Boolean).join(" ");
  return <button ref={ref} className={classes || undefined} {...rest} />;
});
