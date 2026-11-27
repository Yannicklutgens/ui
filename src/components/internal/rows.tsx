// Shared by List and Table: mobile detection, the row checkbox, selection bookkeeping and swipe-to-reveal rows.
import {
  CSSProperties,
  KeyboardEvent,
  MouseEvent,
  PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export const MOBILE_QUERY = "(max-width: 480px)";
// movement before a touch counts as a horizontal swipe
const SWIPE_THRESHOLD = 8;

export function useMediaQuery(query: string) {
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

export type CheckState = "none" | "some" | "all";

// A span instead of <input type="checkbox">: rows can be links, and a native checkbox
// inside a link doesn't reliably toggle once the link's navigation is prevented.
export function Checkbox({ state, label, onToggle }: { state: CheckState; label: string; onToggle: () => void }) {
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

export type RowValue = string | number;

/** Selection over the rows currently rendered: rows register their value, so select-all knows what "all" is. */
export function useSelection(
  selectable: boolean,
  selected: RowValue[],
  onSelectedChange: ((values: RowValue[]) => void) | undefined,
) {
  const [values, setValues] = useState<RowValue[]>([]);

  const register = useCallback((value: RowValue) => {
    setValues((v) => [...v, value]);
    return () => setValues((v) => v.filter((x) => x !== value));
  }, []);

  // drop selections whose rows are gone, e.g. after switching folders
  useEffect(() => {
    if (!selectable) return;
    const kept = selected.filter((v) => values.includes(v));
    if (kept.length !== selected.length) onSelectedChange?.(kept);
  }, [values]);

  const selectedCount = values.filter((v) => selected.includes(v)).length;
  const allState: CheckState = selectedCount === 0 ? "none" : selectedCount === values.length ? "all" : "some";

  return {
    register,
    selectedCount,
    allState,
    isSelected: (v: RowValue) => selected.includes(v),
    toggle: (v: RowValue) =>
      onSelectedChange?.(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]),
    toggleAll: () => onSelectedChange?.(allState === "all" ? [] : values),
  };
}

/** The rows that share swipe state: only one of them is open at a time. */
export interface SwipeGroup {
  openSwipe: symbol | null;
  setOpenSwipe: (id: symbol | null) => void;
}

// Swipe a row left (end panel) or right (start panel) to reveal the controls behind it. Touch and pen only,
// mouse users get the inline slots on bigger screens. Vertical movement stays with the browser (touch-action: pan-y)
// so the page still scrolls.
export function useSwipe<T extends HTMLElement = HTMLElement>(
  enabled: boolean,
  group: SwipeGroup | null,
  hasStart: boolean,
  hasEnd: boolean,
) {
  const id = useRef<symbol>(Symbol("row")).current;
  const itemRef = useRef<T>(null);
  // the panels behind the row: start (left) and end (right)
  const startRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const startWidth = () => (hasStart ? startRef.current?.offsetWidth ?? 0 : 0);
  const endWidth = () => (hasEnd ? actionsRef.current?.offsetWidth ?? 0 : 0);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const offsetRef = useRef(0);
  const gesture = useRef<{ x: number; y: number; start: number; swiping: boolean } | null>(null);
  // the last touch was a swipe: swallow the click that may follow it
  const swiped = useRef(false);

  const isOpen = enabled && group?.openSwipe === id;
  const setOpenSwipe = group?.setOpenSwipe;

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
    // a row only moves towards a side that has controls
    move(Math.min(startWidth(), Math.max(-endWidth(), g.start + dx)));
  }

  function onPointerEnd() {
    const g = gesture.current;
    gesture.current = null;
    if (!g?.swiping) return;
    setDragging(false);
    const start = startWidth();
    const end = endWidth();
    if (start > 0 && offsetRef.current > start / 2) {
      move(start);
      setOpenSwipe?.(id);
    } else if (end > 0 && offsetRef.current < -end / 2) {
      move(-end);
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

  return { enabled, rowProps, itemRef, startRef, actionsRef, close };
}

type PointerEvent_ = ReactPointerEvent<HTMLElement>;

/** Click handler for slots whose controls act on their own: keeps the click from reaching the row (link / onClick). */
export function stopRowClick(e: MouseEvent) {
  e.preventDefault();
  e.stopPropagation();
}
