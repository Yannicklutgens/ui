import { HTMLAttributes } from "react";

export type AlertTone = "neutral" | "success" | "warning" | "danger";

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  tone?: AlertTone;
}

export function Alert({ tone = "neutral", className, ...rest }: AlertProps) {
  const toneClass = tone === "neutral" ? "" : `alert-${tone}`;
  return <div className={["alert", toneClass, className].filter(Boolean).join(" ")} {...rest} />;
}
