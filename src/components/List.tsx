import {
  CSSProperties,
  HTMLAttributes,
  KeyboardEvent,
  MouseEvent,
  MouseEventHandler,
  PointerEvent as ReactPointerEvent,
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { NavLink } from "react-router-dom";

export type ListValue = string | number;

interface ListContextValue {
  selectable: boolean;
  isSelected: (value: ListValue) => boolean;
  toggle: (value: ListValue) => void;
  register: (value: ListValue) => () => void;
  /** Trailing controls sit behind the row and are revealed by swiping it left (hideTrailingOnMobile on a small screen). */
  swipe: boolean;
  /** The row that is swiped open, only one at a time. */
  openSwipe: symbol | null;
  setOpenSwipe: (id: symbol | null) => void;
}

const MOBILE_QUERY = "(max-width: 480px)";
// movement before a touch counts as a horizontal swipe
const SWIPE_THRESHOLD = 8;

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
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

export interface ListProps extends Omit<HTMLAttributes<HTMLUListElement>, "title"> {
  density?: ListDensity;
  /** Name shown on the left of the header, after the select-all checkbox. */
  title?: ReactNode;
  /** Toolbar content shown above the rows, e.g. filters and buttons. */
  header?: ReactNode;
  /** Adds a checkbox to every ListItem that has a `value`, and a select-all checkbox to the header. */
  selectable?: boolean;
  selected?: ListValue[];
  onSelectedChange?: (values: ListValue[]) => void;
  /**
   * Hides each row's `trailing` slot on small screens and lets the description use the full width.
   * For lists whose row actions can also be reached another way (selection toolbar, context menu).
   */
  hideTrailingOnMobile?: boolean;
}

export function List({
  density = "default",
  title,
  header,
  selectable = false,
  selected = [],
  onSelectedChange,
  hideTrailingOnMobile = false,
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

  const isMobile = useMediaQuery(MOBILE_QUERY);
  const swipe = hideTrailingOnMobile && isMobile;
  const [openSwipe, setOpenSwipe] = useState<symbol | null>(null);

  const ctx = useMemo<ListContextValue>(
    () => ({
      selectable,
      isSelected: (v) => selected.includes(v),
      toggle: (v) =>
        onSelectedChange?.(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]),
      register,
      swipe,
      openSwipe,
      setOpenSwipe,
    }),
    [selectable, selected, onSelectedChange, register, swipe, openSwipe],
  );

  const selectedCount = values.filter((v) => selected.includes(v)).length;
  const allState: CheckState =
    selectedCount === 0 ? "none" : selectedCount === values.length ? "all" : "some";

  const classes = [
    "list",
    density === "compact" ? "list-compact" : "",
    hideTrailingOnMobile ? "list-mobile-no-trailing" : "",
    className,
  ].filter(Boolean).join(" ");
  const densityStyle =
    typeof density === "number" ? ({ "--list-item-padding-y": `${density}px` } as CSSProperties) : undefined;

  return (
    <ListContext.Provider value={ctx}>
      {(title || header || selectable) && (
        <div className="panel-header list-header" style={densityStyle}>
          {selectable && (
            <Checkbox
              state={allState}
              label="Select all"
              onToggle={() => onSelectedChange?.(allState === "all" ? [] : values)}
            />
          )}
          {title && <h2 className="list-header-title">{title}</h2>}
          {selectable && selectedCount > 0 && <span className="list-header-count">{selectedCount} selected</span>}
          {header && <div className="panel-header-end">{header}</div>}
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
  /** Right-click handler, e.g. `onContextMenu` from useContextMenu. */
  onContextMenu?: MouseEventHandler<HTMLElement>;
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
  onContextMenu,
  className,
}: ListItemProps) {
  const list = useContext(ListContext);
  const selectable = !!list?.selectable && value !== undefined;
  const isSelected = selectable && list!.isSelected(value!);
  const register = list?.register;

  useEffect(() => {
    if (selectable && register) return register(value!);
  }, [selectable, value, register]);

  const swipe = useSwipe(!!list?.swipe && !!trailing, list);

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
      {trailing && !swipe.enabled && (
        // Controls in the trailing slot act on their own: keep their clicks from
        // reaching the row (NavLink navigation / row onClick).
        <span
          className="list-item-trailing"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {trailing}
        </span>
      )}
    </>
  );

  let row: ReactNode;
  if (to !== undefined) {
    row = (
      <NavLink to={to} end={end} onClick={onClick} onContextMenu={onContextMenu} {...swipe.rowProps} className={({ isActive }) => classes(isActive || !!active)}>
        {content}
      </NavLink>
    );
  } else if (onClick) {
    row = (
      <button type="button" onClick={onClick} onContextMenu={onContextMenu} {...swipe.rowProps} className={classes(!!active)}>
        {content}
      </button>
    );
  } else {
    row = (
      <div onContextMenu={onContextMenu} {...swipe.rowProps} className={classes(!!active)}>
        {content}
      </div>
    );
  }

  if (!swipe.enabled) return <li>{row}</li>;

  return (
    <li ref={swipe.itemRef} className="list-item-swipe">
      {row}
      <div
        ref={swipe.actionsRef}
        className="list-item-swipe-actions"
        // like the inline trailing slot: controls act on their own, then the row closes
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          swipe.close();
        }}
      >
        {trailing}
      </div>
    </li>
  );
}

// Swipe a row left to reveal the controls behind it. Touch and pen only, mouse users get the inline trailing slot
// on bigger screens. Vertical movement stays with the browser (touch-action: pan-y) so the list still scrolls.
function useSwipe(enabled: boolean, list: ListContextValue | null) {
  const id = useRef<symbol>(Symbol("list-item")).current;
  const itemRef = useRef<HTMLLIElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const offsetRef = useRef(0);
  const gesture = useRef<{ x: number; y: number; start: number; swiping: boolean } | null>(null);
  // the last touch was a swipe: swallow the click that may follow it
  const swiped = useRef(false);

  const isOpen = enabled && list?.openSwipe === id;
  const setOpenSwipe = list?.setOpenSwipe;

  function move(to: number) {
    offsetRef.current = to;
    setOffset(to);
  }

  const close = useCallback(() => {
    move(0);
    setOpenSwipe?.(null);
  }, [setOpenSwipe]);

  // another row opened, or swiping got turned off (e.g. the screen got wider)
  useEffect(() => {
    if (!isOpen && !gesture.current?.swiping && offsetRef.current !== 0) move(0);
  }, [isOpen]);

  // a tap anywhere outside the open row closes it
  useEffect(() => {
    if (!isOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (!itemRef.current?.contains(e.target as Node)) close();
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isOpen, close]);

  function onPointerDown(e: PointerEvent_) {
    swiped.current = false;
    if (e.pointerType === "mouse") return;
    gesture.current = { x: e.clientX, y: e.clientY, start: offsetRef.current, swiping: false };
  }

  function onPointerMove(e: PointerEvent_) {
    const g = gesture.current;
    if (!g) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (!g.swiping) {
      if (Math.abs(dy) > SWIPE_THRESHOLD && Math.abs(dy) >= Math.abs(dx)) {
        gesture.current = null; // a scroll, not a swipe
        return;
      }
      if (Math.abs(dx) < SWIPE_THRESHOLD) return;
      g.swiping = true;
      swiped.current = true;
      setDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    const width = actionsRef.current?.offsetWidth ?? 0;
    move(Math.min(0, Math.max(-width, g.start + dx)));
  }

  function onPointerEnd() {
    const g = gesture.current;
    gesture.current = null;
    if (!g?.swiping) return;
    setDragging(false);
    const width = actionsRef.current?.offsetWidth ?? 0;
    if (width > 0 && offsetRef.current < -width / 2) {
      move(-width);
      setOpenSwipe?.(id);
    } else {
      close();
    }
  }

  // after a swipe, or on an open row, a tap only closes it: no navigation, no row onClick
  function onClickCapture(e: MouseEvent) {
    if (!swiped.current && !isOpen) return;
    e.preventDefault();
    e.stopPropagation();
    swiped.current = false;
    if (isOpen) close();
  }

  const rowProps = enabled
    ? {
        onPointerDown,
        onPointerMove,
        onPointerUp: onPointerEnd,
        onPointerCancel: onPointerEnd,
        onClickCapture,
        style: {
          transform: offset ? `translateX(${offset}px)` : undefined,
          transition: dragging ? "none" : undefined,
        } as CSSProperties,
      }
    : {};

  return { enabled, rowProps, itemRef, actionsRef, close };
}

type PointerEvent_ = ReactPointerEvent<HTMLElement>;
