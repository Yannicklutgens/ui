import { HTMLAttributes, ReactNode } from "react";

export interface PanelProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** Left side of the header, e.g. a title or sender info. */
  title?: ReactNode;
  /** Toolbar on the right side of the header, e.g. buttons. */
  actions?: ReactNode;
}

/** Bordered box around content such as a table or List. The header only renders when `title` or `actions` is set. */
export function Panel({ title, actions, className, children, ...rest }: PanelProps) {
  return (
    <div className={["panel", className].filter(Boolean).join(" ")} {...rest}>
      {(title || actions) && (
        <div className="panel-header">
          {title && <div className="panel-header-title">{title}</div>}
          {actions && <div className="panel-header-actions">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

/** @deprecated Use Panel. */
export const TableWrap = Panel;
