import { HTMLAttributes } from "react";

export type DividerOrientation = "horizontal" | "vertical";

export interface DividerProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: DividerOrientation;
}

/** A 1px line in the `--border-strong` color, horizontal (90% wide) or vertical (20px tall). */
export function Divider({ orientation = "horizontal", className, ...rest }: DividerProps) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={["divider", `divider-${orientation}`, className].filter(Boolean).join(" ")}
      {...rest}
    />
  );
}
