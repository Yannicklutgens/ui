import { InputHTMLAttributes, ReactNode } from "react";

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: ReactNode;
}

export function Switch({ label, className, ...rest }: SwitchProps) {
  const control = (
    <span className="switch">
      <input type="checkbox" {...rest} />
      <span className="switch-track" />
    </span>
  );

  if (!label) return control;

  return (
    <label className={["switch-label", className].filter(Boolean).join(" ")}>
      {control}
      {label}
    </label>
  );
}
