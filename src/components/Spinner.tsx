import { HTMLAttributes } from "react";

export function Spinner({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={["spinner", className].filter(Boolean).join(" ")} role="status" aria-label="Loading" {...rest} />;
}
