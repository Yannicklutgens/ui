import { HTMLAttributes, MouseEventHandler, ReactNode } from "react";
import { NavLink } from "react-router-dom";

export function List({ className, ...rest }: HTMLAttributes<HTMLUListElement>) {
  return <ul className={["list", className].filter(Boolean).join(" ")} {...rest} />;
}

export interface ListItemProps {
  /** Router path; renders a NavLink that gets `active` automatically when it matches. */
  to?: string;
  /** Only match `to` exactly (NavLink `end`). */
  end?: boolean;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  emphasized?: boolean;
  active?: boolean;
  onClick?: MouseEventHandler<HTMLElement>;
  className?: string;
}

export function ListItem({
  to,
  end,
  title,
  description,
  meta,
  leading,
  trailing,
  emphasized,
  active,
  onClick,
  className,
}: ListItemProps) {
  const classes = (isActive: boolean) =>
    ["list-item", emphasized ? "emphasized" : "", isActive ? "active" : "", className]
      .filter(Boolean)
      .join(" ");

  const content = (
    <>
      {leading && <span className="list-item-leading">{leading}</span>}
      <span className="list-item-title">{title}</span>
      {description && <span className="list-item-description">{description}</span>}
      {meta && <span className="list-item-meta">{meta}</span>}
      {trailing && <span className="list-item-trailing">{trailing}</span>}
    </>
  );

  let row: ReactNode;
  if (to !== undefined) {
    row = (
      <NavLink to={to} end={end} onClick={onClick} className={({ isActive }) => classes(isActive || !!active)}>
        {content}
      </NavLink>
    );
  } else if (onClick) {
    row = (
      <button type="button" onClick={onClick} className={classes(!!active)}>
        {content}
      </button>
    );
  } else {
    row = <div className={classes(!!active)}>{content}</div>;
  }

  return <li>{row}</li>;
}
