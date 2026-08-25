import { HTMLAttributes } from "react";

export function TableWrap({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={["table-wrap", className].filter(Boolean).join(" ")} {...rest} />;
}
