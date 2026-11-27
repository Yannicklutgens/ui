import {
  CSSProperties,
  HTMLAttributes,
  MouseEvent,
  MouseEventHandler,
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { NavLink } from "react-router-dom";
import { Checkbox, MOBILE_QUERY, RowValue, SwipeGroup, useMediaQuery, useSelection, useSwipe } from "./internal/rows";

export type ListValue = RowValue;

interface ListContextValue extends SwipeGroup {
  selectable: boolean;
  isSelected: (value: ListValue) => boolean;
  toggle: (value: ListValue) => void;
  register: (value: ListValue) => () => void;
  /**
   * Row controls sit behind the row (hideTrailingOnMobile on a small screen): `swipeTrailing` (default
   * `trailing`) is revealed by swiping the row left, `swipeLeading` (default `leadingActions`) by swiping it right.
   */
  swipe: boolean;
}

const ListContext = createContext<ListContextValue | null>(null);

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
  const selection = useSelection(selectable, selected, onSelectedChange);

  const isMobile = useMediaQuery(MOBILE_QUERY);
  const swipe = hideTrailingOnMobile && isMobile;
  const [openSwipe, setOpenSwipe] = useState<symbol | null>(null);

  const ctx = useMemo<ListContextValue>(
    () => ({
      selectable,
      isSelected: selection.isSelected,
      toggle: selection.toggle,
      register: selection.register,
      swipe,
      openSwipe,
      setOpenSwipe,
    }),
    [selectable, selected, onSelectedChange, selection.register, swipe, openSwipe],
  );

  const { selectedCount, allState } = selection;

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
              onToggle={selection.toggleAll}
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
  /** Buttons at the start of the row, inline after `leading`. Not shown while the row swipes (see `swipeLeading`). */
  leadingActions?: ReactNode;
  /** Controls at the end of the row. Not shown while the row swipes (see `swipeTrailing`). */
  trailing?: ReactNode;
  /**
   * Controls behind the row, revealed by swiping it right (List `hideTrailingOnMobile` on a small screen, touch).
   * Defaults to `leadingActions`; `null` gives the row no left panel.
   */
  swipeLeading?: ReactNode;
  /**
   * Controls behind the row, revealed by swiping it left (List `hideTrailingOnMobile` on a small screen, touch).
   * Defaults to `trailing`; `null` gives the row no right panel.
   */
  swipeTrailing?: ReactNode;
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
  leadingActions,
  trailing,
  swipeLeading,
  swipeTrailing,
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

  // what sits behind the row while swiping: its own props, or else the inline controls
  const swipeStart = swipeLeading !== undefined ? swipeLeading : leadingActions;
  const swipeEnd = swipeTrailing !== undefined ? swipeTrailing : trailing;
  const swipe = useSwipe<HTMLLIElement>(!!list?.swipe && (!!swipeStart || !!swipeEnd), list, !!swipeStart, !!swipeEnd);
  const inlineLeadingActions = !!leadingActions && !swipe.enabled;

  const classes = (isActive: boolean) =>
    ["list-item", emphasized ? "emphasized" : "", isSelected ? "selected" : "", isActive ? "active" : "", className]
      .filter(Boolean)
      .join(" ");

  const content = (
    <>
      {(selectable || leading || inlineLeadingActions) && (
        <span className="list-item-leading">
          {selectable && (
            <Checkbox
              state={isSelected ? "all" : "none"}
              label="Select row"
              onToggle={() => list!.toggle(value!)}
            />
          )}
          {leading}
          {inlineLeadingActions && (
            // like the trailing slot: the buttons act on their own, not as a click on the row
            <span
              className="list-item-leading-actions"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              {leadingActions}
            </span>
          )}
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

  // like the inline slots: controls act on their own, then the row closes
  const closeAfterClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    swipe.close();
  };

  return (
    <li ref={swipe.itemRef} className="list-item-swipe">
      {row}
      {swipeStart && (
        <div ref={swipe.startRef} className="list-item-swipe-actions start" onClick={closeAfterClick}>
          {swipeStart}
        </div>
      )}
      {swipeEnd && (
        <div ref={swipe.actionsRef} className="list-item-swipe-actions" onClick={closeAfterClick}>
          {swipeEnd}
        </div>
      )}
    </li>
  );
}
