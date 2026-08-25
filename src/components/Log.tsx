import { HTMLAttributes } from "react";

export function Log({ className, ...rest }: HTMLAttributes<HTMLPreElement>) {
  return <pre className={["log", className].filter(Boolean).join(" ")} {...rest} />;
}
