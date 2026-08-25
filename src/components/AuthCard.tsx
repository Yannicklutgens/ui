import { HTMLAttributes } from "react";

export function AuthShell({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={["auth-shell", className].filter(Boolean).join(" ")} {...rest} />;
}

export function AuthCard({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={["auth-card", className].filter(Boolean).join(" ")} {...rest} />;
}
