import { HTMLAttributes, ReactNode } from "react";

export interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  /** Toolbar content on the left side of the header, e.g. buttons. */
  headerStart?: ReactNode;
  /** Toolbar content on the right side of the header, e.g. buttons. */
  headerEnd?: ReactNode;
  /** Drop the body padding for edge-to-edge content. Tables and Lists are flush automatically. */
  flush?: boolean;
}

/** Bordered box around content. The header only renders when `headerStart` or `headerEnd` is set. */
export function Panel({ headerStart, headerEnd, flush, className, children, ...rest }: PanelProps) {
  return (
    <div className={["panel", className].filter(Boolean).join(" ")} {...rest}>
      {(headerStart || headerEnd) && (
        <div className="panel-header">
          {headerStart && <div className="panel-header-start">{headerStart}</div>}
          {headerEnd && <div className="panel-header-end">{headerEnd}</div>}
        </div>
      )}
      <div className={["panel-body", flush ? "panel-body-flush" : ""].filter(Boolean).join(" ")}>{children}</div>
    </div>
  );
}

/** @deprecated Use Panel. */
export const TableWrap = Panel;
