import { HTMLAttributes } from "react";

export type BadgeTone =
  | "neutral"
  | "online"
  | "success"
  | "pending"
  | "running"
  | "offline"
  | "error"
  | "failure";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  dot?: boolean;
}

export function Badge({ tone = "neutral", dot = true, className, children, ...rest }: BadgeProps) {
  const toneClass = tone === "neutral" ? "" : `badge-${tone}`;
  return (
    <span className={["badge", toneClass, className].filter(Boolean).join(" ")} {...rest}>
      {dot && <span className="badge-dot" />}
      {children}
    </span>
  );
}
