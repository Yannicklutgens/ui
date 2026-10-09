import {
  CSSProperties,
  HTMLAttributes,
  KeyboardEvent,
  MouseEvent,
  MouseEventHandler,
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { NavLink } from "react-router-dom";

export type ListValue = string | number;

interface ListContextValue {
  selectable: boolean;
  isSelected: (value: ListValue) => boolean;
  toggle: (value: ListValue) => void;
  register: (value: ListValue) => () => void;
}

const ListContext = createContext<ListContextValue | null>(null);

type CheckState = "none" | "some" | "all";

// A span instead of <input type="checkbox">: rows can be links, and a native checkbox
// inside a link doesn't reliably toggle once the link's navigation is prevented.
function Checkbox({ state, label, onToggle }: { state: CheckState; label: string; onToggle: () => void }) {
  function handle(e: MouseEvent | KeyboardEvent) {
    e.preventDefault();
    e.stopPropagation();
    onToggle();
  }

  return (
    <span
      role="checkbox"
      aria-checked={state === "all" ? true : state === "some" ? "mixed" : false}
      aria-label={label}
      tabIndex={0}
      className={["list-checkbox", state === "all" ? "checked" : "", state === "some" ? "mixed" : ""]
        .filter(Boolean)
        .join(" ")}
      onClick={handle}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") handle(e);
      }}
    />
  );
}

/** A preset, or the vertical row padding in px (default is 10, compact is 6). */
export type ListDensity = "default" | "compact" | number;

export interface ListProps extends HTMLAttributes<HTMLUListElement> {
  density?: ListDensity;
  /** Toolbar content shown above the rows, e.g. filters and buttons. */
  header?: ReactNode;
  /** Adds a checkbox to every ListItem that has a `value`, and a select-all checkbox to the header. */
  selectable?: boolean;
  selected?: ListValue[];
  onSelectedChange?: (values: ListValue[]) => void;
}

export function List({
  density = "default",
  header,
  selectable = false,
  selected = [],
  onSelectedChange,
  className,
  style,
  children,
  ...rest
}: ListProps) {
  // values of the rows currently rendered, so select-all knows what "all" is
  const [values, setValues] = useState<ListValue[]>([]);

  const register = useCallback((value: ListValue) => {
    setValues((v) => [...v, value]);
    return () => setValues((v) => v.filter((x) => x !== value));
  }, []);

  // drop selections whose rows are gone, e.g. after switching folders
  useEffect(() => {
    if (!selectable) return;
    const kept = selected.filter((v) => values.includes(v));
    if (kept.length !== selected.length) onSelectedChange?.(kept);
  }, [values]);

  const ctx = useMemo<ListContextValue>(
    () => ({
      selectable,
      isSelected: (v) => selected.includes(v),
      toggle: (v) =>
        onSelectedChange?.(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]),
      register,
    }),
    [selectable, selected, onSelectedChange, register],
  );

  const selectedCount = values.filter((v) => selected.includes(v)).length;
  const allState: CheckState =
    selectedCount === 0 ? "none" : selectedCount === values.length ? "all" : "some";

  const classes = ["list", density === "compact" ? "list-compact" : "", className].filter(Boolean).join(" ");
  const densityStyle =
    typeof density === "number" ? ({ "--list-item-padding-y": `${density}px` } as CSSProperties) : undefined;

  return (
    <ListContext.Provider value={ctx}>
      {(header || selectable) && (
        <div className="list-header" style={densityStyle}>
          {selectable && (
            <Checkbox
              state={allState}
              label="Select all"
              onToggle={() => onSelectedChange?.(allState === "all" ? [] : values)}
            />
          )}
          {selectable && selectedCount > 0 && <span className="list-header-count">{selectedCount} selected</span>}
          {header && <div className="list-header-content">{header}</div>}
        </div>
      )}
      <ul className={classes} style={{ ...densityStyle, ...style }} {...rest}>
        {children}
      </ul>
    </ListContext.Provider>
  );
}

export interface ListItemProps {
  /** Router path; renders a NavLink that gets `active` automatically when it matches. */
  to?: string;
  /** Only match `to` exactly (NavLink `end`). */
  end?: boolean;
  /** Identifies the row for selection in a `selectable` List. */
  value?: ListValue;
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
  value,
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
  const list = useContext(ListContext);
  const selectable = !!list?.selectable && value !== undefined;
  const isSelected = selectable && list!.isSelected(value!);
  const register = list?.register;

  useEffect(() => {
    if (selectable && register) return register(value!);
  }, [selectable, value, register]);

  const classes = (isActive: boolean) =>
    ["list-item", emphasized ? "emphasized" : "", isSelected ? "selected" : "", isActive ? "active" : "", className]
      .filter(Boolean)
      .join(" ");

  const content = (
    <>
      {(selectable || leading) && (
        <span className="list-item-leading">
          {selectable && (
            <Checkbox
              state={isSelected ? "all" : "none"}
              label="Select row"
              onToggle={() => list!.toggle(value!)}
            />
          )}
          {leading}
        </span>
      )}
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
