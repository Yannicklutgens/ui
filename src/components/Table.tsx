import {
  CSSProperties,
  Children,
  HTMLAttributes,
  MouseEvent,
  MouseEventHandler,
  ReactNode,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { NavLink } from "react-router-dom";
import { Icon } from "./Icon";
import {
  CheckState,
  Checkbox,
  MOBILE_QUERY,
  RowValue,
  SwipeGroup,
  stopRowClick,
  useMediaQuery,
  useSelection,
  useSwipe,
} from "./internal/rows";

export type TableValue = RowValue;
export type TableAlign = "left" | "center" | "right";
export type TableSortDir = "asc" | "desc";
export interface TableSort {
  key: string;
  dir: TableSortDir;
}
/**
 * What the table does on a small screen (≤480px):
 * - "hide" (default): columns whose TableHeader has `hideOnMobile` are left out, the rest stays a table.
 * - "stack": every row becomes a card with a "label: value" line per cell (labels come from the headers).
 * - "scroll": every column stays and the table scrolls sideways. Rows don't swipe then (it would fight the
 *   sideways scroll), so `trailing` and `leadingActions` stay inline.
 */
export type TableOverflow = "hide" | "stack" | "scroll";
/** A preset, or the vertical cell padding in px (default is 10, compact is 6). */
export type TableDensity = "default" | "compact" | number;

interface Column {
  width: string;
  align?: TableAlign;
  label?: string;
  hideOnMobile: boolean;
}

interface TableContextValue extends SwipeGroup {
  selectable: boolean;
  isSelected: (value: TableValue) => boolean;
  toggle: (value: TableValue) => void;
  toggleAll: () => void;
  allState: CheckState;
  register: (value: TableValue) => () => void;
  /** Row controls sit behind the row and are revealed by swiping (hideTrailingOnMobile on a small screen). */
  swipe: boolean;
  sort?: TableSort;
  onSortChange?: (sort: TableSort) => void;
  columns: (Column | undefined)[];
  setColumn: (index: number, column: Column | undefined) => void;
}

// layout effect on the client so the column tracks are set before paint, plain effect on the server
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const TableContext = createContext<TableContextValue | null>(null);
// position of a TableHeader / TableCell among its row's children
const ColumnIndexContext = createContext(0);

function useTable(component: string) {
  const ctx = useContext(TableContext);
  if (!ctx) throw new Error(`${component} must be used inside a Table`);
  return ctx;
}

// Gives every child its column index. Leading (checkbox) and trailing (actions) columns come before and after.
function withColumnIndex(children: ReactNode) {
  return Children.toArray(children).map((child, i) => (
    <ColumnIndexContext.Provider key={isValidElement(child) && child.key != null ? child.key : i} value={i}>
      {child}
    </ColumnIndexContext.Provider>
  ));
}

const toTrack = (width: string | number | undefined) =>
  width === undefined ? "auto" : typeof width === "number" ? `${width}px` : width;

export interface TableProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  density?: TableDensity;
  /** Name shown on the left of the header bar above the table. */
  title?: ReactNode;
  /** Toolbar content in the header bar above the table, e.g. filters and buttons. */
  header?: ReactNode;
  /** Adds a checkbox to every TableRow that has a `value`, and a select-all checkbox to the TableHead. */
  selectable?: boolean;
  selected?: TableValue[];
  onSelectedChange?: (values: TableValue[]) => void;
  /** The current sort, shown on the TableHeader with the same `sortKey`. Sorting the rows is up to you. */
  sort?: TableSort;
  /** Called when a sortable TableHeader is clicked: ascending first, then toggles the direction. */
  onSortChange?: (sort: TableSort) => void;
  /**
   * On small screens, takes `trailing` and `leadingActions` out of the rows. On touch, the controls sit behind the
   * row and are revealed by swiping it (left for `swipeTrailing`, right for `swipeLeading`), like a List.
   */
  hideTrailingOnMobile?: boolean;
  overflow?: TableOverflow;
}

export function Table({
  density = "default",
  title,
  header,
  selectable = false,
  selected = [],
  onSelectedChange,
  sort,
  onSortChange,
  hideTrailingOnMobile = false,
  overflow = "hide",
  className,
  style,
  children,
  ...rest
}: TableProps) {
  const selection = useSelection(selectable, selected, onSelectedChange);
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const swipe = hideTrailingOnMobile && isMobile && overflow !== "scroll";
  const [openSwipe, setOpenSwipe] = useState<symbol | null>(null);
  const [columns, setColumns] = useState<(Column | undefined)[]>([]);

  const setColumn = useCallback((index: number, column: Column | undefined) => {
    setColumns((prev) => {
      const next = [...prev];
      next[index] = column;
      while (next.length && !next[next.length - 1]) next.pop();
      return next;
    });
  }, []);

  const ctx = useMemo<TableContextValue>(
    () => ({
      selectable,
      isSelected: selection.isSelected,
      toggle: selection.toggle,
      toggleAll: selection.toggleAll,
      allState: selection.allState,
      register: selection.register,
      swipe,
      openSwipe,
      setOpenSwipe,
      sort,
      onSortChange,
      columns,
      setColumn,
    }),
    [selectable, selected, onSelectedChange, selection.allState, selection.register, swipe, openSwipe, sort, onSortChange, columns, setColumn],
  );

  // leading (checkbox, leadingActions) and trailing (row controls) take only the room their content needs
  const hidden = (c: Column) => c.hideOnMobile && isMobile && overflow !== "scroll";
  const template = ["max-content", ...columns.map((c) => (!c ? "auto" : hidden(c) ? "0px" : c.width)), "max-content"].join(" ");

  const classes = [
    "table",
    `table-overflow-${overflow}`,
    density === "compact" ? "table-compact" : "",
    hideTrailingOnMobile ? "table-mobile-no-trailing" : "",
    className,
  ].filter(Boolean).join(" ");
  const densityStyle =
    typeof density === "number" ? ({ "--table-cell-padding-y": `${density}px` } as CSSProperties) : undefined;

  return (
    <TableContext.Provider value={ctx}>
      {(title || header) && (
        <div className="panel-header list-header">
          {title && <h2 className="list-header-title">{title}</h2>}
          {selectable && selection.selectedCount > 0 && (
            <span className="list-header-count">{selection.selectedCount} selected</span>
          )}
          {header && <div className="panel-header-end">{header}</div>}
        </div>
      )}
      <div
        role="table"
        className={classes}
        style={{ gridTemplateColumns: template, ...densityStyle, ...style }}
        {...rest}
      >
        {children}
      </div>
    </TableContext.Provider>
  );
}

export interface TableHeadProps extends HTMLAttributes<HTMLDivElement> {}

/** The header row. Put TableHeaders in it, one per column, in the same order as the TableCells in each row. */
export function TableHead({ className, children, ...rest }: TableHeadProps) {
  const table = useTable("TableHead");
  return (
    <div role="row" className={["table-row table-head", className].filter(Boolean).join(" ")} {...rest}>
      {table.selectable && (
        <span role="columnheader" className="table-cell table-cell-leading">
          <Checkbox state={table.allState} label="Select all" onToggle={table.toggleAll} />
        </span>
      )}
      {withColumnIndex(children)}
    </div>
  );
}

export interface TableHeaderProps extends HTMLAttributes<HTMLSpanElement> {
  /** Grid track of the column, e.g. "1fr", 120 (px) or "minmax(0, 2fr)". Defaults to "auto". */
  width?: string | number;
  align?: TableAlign;
  /** Makes the header a sort button; Table `sort` / `onSortChange` use this key. */
  sortKey?: string;
  /** Leave this column out on small screens (Table overflow "hide" and "stack"). */
  hideOnMobile?: boolean;
  /** Label for the cells in "stack" mode. Defaults to the header text when it is a string. */
  label?: string;
}

export function TableHeader({
  width,
  align,
  sortKey,
  hideOnMobile = false,
  label,
  className,
  style,
  children,
  ...rest
}: TableHeaderProps) {
  const table = useTable("TableHeader");
  const index = useContext(ColumnIndexContext);
  const setColumn = table.setColumn;
  const track = toTrack(width);
  const text = label ?? (typeof children === "string" || typeof children === "number" ? String(children) : undefined);

  useIsomorphicLayoutEffect(() => {
    setColumn(index, { width: track, align, label: text, hideOnMobile });
    return () => setColumn(index, undefined);
  }, [setColumn, index, track, align, text, hideOnMobile]);

  const sortable = sortKey !== undefined && !!table.onSortChange;
  const dir = sortKey !== undefined && table.sort?.key === sortKey ? table.sort.dir : undefined;

  return (
    <span
      role="columnheader"
      aria-sort={sortKey === undefined ? undefined : dir === "asc" ? "ascending" : dir === "desc" ? "descending" : "none"}
      className={cellClasses(align, hideOnMobile, className)}
      style={{ "--table-col": index + 2, ...style } as CSSProperties}
      {...rest}
    >
      {sortable ? (
        <button
          type="button"
          className={["table-sort", dir ? "active" : ""].filter(Boolean).join(" ")}
          onClick={() => table.onSortChange!({ key: sortKey!, dir: dir === "asc" ? "desc" : "asc" })}
        >
          {children}
          <Icon className="table-sort-icon" name={dir === "asc" ? "arrow-up" : dir === "desc" ? "arrow-down" : "swap-vertical"} />
        </button>
      ) : (
        children
      )}
    </span>
  );
}

function cellClasses(align: TableAlign | undefined, hideOnMobile: boolean | undefined, className?: string) {
  return [
    "table-cell",
    align && align !== "left" ? `table-align-${align}` : "",
    hideOnMobile ? "table-cell-hide-mobile" : "",
    className,
  ].filter(Boolean).join(" ");
}

export interface TableRowProps {
  /** Router path; renders a NavLink that gets `active` automatically when it matches. */
  to?: string;
  /** Only match `to` exactly (NavLink `end`). */
  end?: boolean;
  /** Identifies the row for selection in a `selectable` Table. */
  value?: TableValue;
  /** Buttons at the start of the row, after the checkbox. Not shown while the row swipes (see `swipeLeading`). */
  leadingActions?: ReactNode;
  /** Controls at the end of the row. Not shown while the row swipes (see `swipeTrailing`). */
  trailing?: ReactNode;
  /** Controls behind the row, revealed by swiping it right. Defaults to `leadingActions`; `null` for none. */
  swipeLeading?: ReactNode;
  /** Controls behind the row, revealed by swiping it left. Defaults to `trailing`; `null` for none. */
  swipeTrailing?: ReactNode;
  emphasized?: boolean;
  active?: boolean;
  onClick?: MouseEventHandler<HTMLElement>;
  /** Right-click handler, e.g. `onContextMenu` from useContextMenu. */
  onContextMenu?: MouseEventHandler<HTMLElement>;
  className?: string;
  /** TableCells, one per TableHeader. */
  children?: ReactNode;
}

export function TableRow({
  to,
  end,
  value,
  leadingActions,
  trailing,
  swipeLeading,
  swipeTrailing,
  emphasized,
  active,
  onClick,
  onContextMenu,
  className,
  children,
}: TableRowProps) {
  const table = useTable("TableRow");
  const selectable = table.selectable && value !== undefined;
  const isSelected = selectable && table.isSelected(value!);
  const register = table.register;

  useEffect(() => {
    if (selectable) return register(value!);
  }, [selectable, value, register]);

  // what sits behind the row while swiping: its own props, or else the inline controls
  const swipeStart = swipeLeading !== undefined ? swipeLeading : leadingActions;
  const swipeEnd = swipeTrailing !== undefined ? swipeTrailing : trailing;
  const swipe = useSwipe<HTMLDivElement>(table.swipe && (!!swipeStart || !!swipeEnd), table, !!swipeStart, !!swipeEnd);
  const inlineLeadingActions = !!leadingActions && !swipe.enabled;

  const classes = (isActive: boolean) =>
    ["table-row", emphasized ? "emphasized" : "", isSelected ? "selected" : "", isActive ? "active" : "", className]
      .filter(Boolean)
      .join(" ");

  const content = (
    <>
      {(selectable || inlineLeadingActions) && (
        <span role="cell" className="table-cell table-cell-leading">
          {selectable && (
            <Checkbox state={isSelected ? "all" : "none"} label="Select row" onToggle={() => table.toggle(value!)} />
          )}
          {inlineLeadingActions && (
            // the buttons act on their own, not as a click on the row
            <span className="table-row-actions" onClick={stopRowClick}>
              {leadingActions}
            </span>
          )}
        </span>
      )}
      {withColumnIndex(children)}
      {trailing && !swipe.enabled && (
        <span role="cell" className="table-cell table-cell-trailing table-row-actions" onClick={stopRowClick}>
          {trailing}
        </span>
      )}
    </>
  );

  let row: ReactNode;
  if (to !== undefined) {
    row = (
      <NavLink role="row" to={to} end={end} onClick={onClick} onContextMenu={onContextMenu} {...swipe.rowProps} className={({ isActive }) => classes(isActive || !!active)}>
        {content}
      </NavLink>
    );
  } else if (onClick) {
    row = (
      <button role="row" type="button" onClick={onClick} onContextMenu={onContextMenu} {...swipe.rowProps} className={classes(!!active)}>
        {content}
      </button>
    );
  } else {
    row = (
      <div role="row" onContextMenu={onContextMenu} {...swipe.rowProps} className={classes(!!active)}>
        {content}
      </div>
    );
  }

  if (!swipe.enabled) return row;

  // like the inline slots: controls act on their own, then the row closes
  const closeAfterClick = (e: MouseEvent) => {
    stopRowClick(e);
    swipe.close();
  };

  return (
    <div ref={swipe.itemRef} className="table-row-swipe">
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
    </div>
  );
}

export interface TableCellProps extends HTMLAttributes<HTMLSpanElement> {
  /** Defaults to the align of the column's TableHeader. */
  align?: TableAlign;
}

export function TableCell({ align, className, style, children, ...rest }: TableCellProps) {
  const table = useTable("TableCell");
  const index = useContext(ColumnIndexContext);
  const column = table.columns[index];

  return (
    <span
      role="cell"
      data-label={column?.label}
      className={cellClasses(align ?? column?.align, column?.hideOnMobile, className)}
      style={{ "--table-col": index + 2, ...style } as CSSProperties}
      {...rest}
    >
      {children}
    </span>
  );
}
