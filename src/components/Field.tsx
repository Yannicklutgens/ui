import { HTMLAttributes, LabelHTMLAttributes, ReactNode } from "react";

export function FormRow({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={["form-row", className].filter(Boolean).join(" ")} {...rest} />;
}

export interface FieldProps extends HTMLAttributes<HTMLDivElement> {
  label?: ReactNode;
  labelProps?: LabelHTMLAttributes<HTMLLabelElement>;
  hint?: ReactNode;
  error?: ReactNode;
}

export function Field({ label, labelProps, hint, error, className, children, ...rest }: FieldProps) {
  return (
    <div className={["field", className].filter(Boolean).join(" ")} {...rest}>
      {label && <label {...labelProps}>{label}</label>}
      {children}
      {error ? <p className="error-text field-hint">{error}</p> : hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}
