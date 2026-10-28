import {
  KeyboardEvent,
  MouseEvent,
  SyntheticEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Icon, IconType } from "./Icon";

interface BaseItem {
  label: string;
  icon?: string;
  iconType?: IconType;
  danger?: boolean;
  disabled?: boolean;
}

/** An action (`onSelect`), a submenu (`items`), or a divider line. */
export type ContextMenuItem =
  | (BaseItem & ({ onSelect: () => void; items?: never } | { items: ContextMenuItem[]; onSelect?: never }))
  | "divider";

const EDGE = 8;
// time to move the mouse diagonally from an item into its submenu
const SWITCH_DELAY = 150;

type Anchor = { x: number; y: number } | DOMRect;

/**
 * Custom right-click menu: spread `onContextMenu` on the element and render `menu` anywhere.
 * Without items `onContextMenu` is undefined and the browser menu shows; Shift + right-click
 * always shows the browser menu.
 */
export function useContextMenu(items?: ContextMenuItem[]) {
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  const close = useCallback((restoreFocus = false) => {
    setPoint(null);
    if (restoreFocus) returnFocus.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!point) return;
    const inside = (e: Event) => rootRef.current?.contains(e.target as Node) ?? false;
    const onPointerDown = (e: PointerEvent) => {
      if (!inside(e)) close();
    };
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") close(true);
    };
    const onScroll = (e: Event) => {
      if (!inside(e)) close();
    };
    const onLeave = () => close();

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onLeave);
    window.addEventListener("blur", onLeave);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onLeave);
      window.removeEventListener("blur", onLeave);
    };
  }, [point, close]);

  const hasItems = !!items && items.length > 0;

  const onContextMenu = hasItems
    ? (e: MouseEvent<HTMLElement>) => {
        if (e.shiftKey) return;
        e.preventDefault();
        e.stopPropagation(); // a parent with its own menu shouldn't open too
        returnFocus.current = document.activeElement as HTMLElement | null;
        setPoint({ x: e.clientX, y: e.clientY });
      }
    : undefined;

  // React bubbles events through portals along the component tree, so keep them from
  // reaching the trigger (e.g. a ListItem's NavLink navigating on click).
  const stop = (e: SyntheticEvent) => e.stopPropagation();

  const menu =
    point && hasItems
      ? createPortal(
          <div
            ref={rootRef}
            onClick={stop}
            onMouseDown={stop}
            onPointerDown={stop}
            onKeyDown={stop}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <MenuList items={items!} anchor={point} autoFocus onClose={close} />
          </div>,
          document.body,
        )
      : null;

  return { onContextMenu, menu };
}

interface MenuListProps {
  items: ContextMenuItem[];
  anchor: Anchor;
  autoFocus: boolean;
  onClose: (restoreFocus?: boolean) => void;
  /** Submenus only: ArrowLeft goes back to the parent item. */
  onBack?: () => void;
  /** Submenus only: the mouse arrived, so the parent keeps it open. */
  onEnter?: () => void;
}

interface OpenSubmenu {
  index: number;
  rect: DOMRect;
  focus: boolean;
}

function MenuList({ items, anchor, autoFocus, onClose, onBack, onEnter }: MenuListProps) {
  const ref = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const timer = useRef<number | undefined>(undefined);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const [open, setOpen] = useState<OpenSubmenu | null>(null);

  // Measure, then place at the cursor (root) or beside the parent item (submenu),
  // flipping left/up when there is no room and kept inside the viewport.
  useLayoutEffect(() => {
    const { width, height } = ref.current!.getBoundingClientRect();
    const maxLeft = window.innerWidth - width - EDGE;
    const maxTop = window.innerHeight - height - EDGE;
    let left: number;
    let top: number;
    if (anchor instanceof DOMRect) {
      left = anchor.right <= maxLeft ? anchor.right : anchor.left - width;
      top = anchor.top - 4; // line the first item up with the parent item
    } else {
      left = anchor.x <= maxLeft ? anchor.x : anchor.x - width;
      top = anchor.y <= maxTop ? anchor.y : anchor.y - height;
    }
    setPosition({
      left: Math.max(EDGE, Math.min(left, maxLeft)),
      top: Math.max(EDGE, Math.min(top, maxTop)),
    });
  }, []);

  const enabled = () => itemRefs.current.filter((el): el is HTMLButtonElement => !!el && !el.disabled);

  useEffect(() => {
    if (position && autoFocus) enabled()[0]?.focus({ preventScroll: true });
  }, [position]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const openAt = (index: number, focus: boolean) =>
    setOpen({ index, rect: itemRefs.current[index]!.getBoundingClientRect(), focus });

  const closeSubmenu = (focusParent: boolean) => {
    const index = open?.index;
    setOpen(null);
    if (focusParent && index !== undefined) itemRefs.current[index]?.focus({ preventScroll: true });
  };

  function hover(index: number, isSubmenu: boolean) {
    window.clearTimeout(timer.current);
    if (open?.index === index) return;
    const change = () => (isSubmenu ? openAt(index, false) : setOpen(null));
    if (open) timer.current = window.setTimeout(change, SWITCH_DELAY);
    else if (isSubmenu) change();
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const buttons = enabled();
    const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      const step = e.key === "ArrowDown" ? 1 : -1;
      const next = current === -1 ? (step === 1 ? 0 : buttons.length - 1) : (current + step + buttons.length) % buttons.length;
      buttons[next]?.focus({ preventScroll: true });
    } else if (e.key === "ArrowRight") {
      const index = itemRefs.current.indexOf(buttons[current]);
      const item = items[index];
      if (item && item !== "divider" && item.items) openAt(index, true);
    } else if (e.key === "ArrowLeft" && onBack) {
      onBack();
    } else {
      return;
    }
    // handled here: a parent level must not act on it too
    e.preventDefault();
    e.stopPropagation();
  }

  const hasIcons = items.some((item) => item !== "divider" && item.icon);

  return (
    <div
      ref={ref}
      className="context-menu"
      role="menu"
      style={position ?? { left: 0, top: 0, visibility: "hidden" }}
      onKeyDown={onKeyDown}
      onMouseEnter={onEnter}
    >
      {items.map((item, index) => {
        if (item === "divider") {
          itemRefs.current[index] = null;
          return <div key={index} className="context-menu-divider" role="separator" />;
        }
        const isSubmenu = !!item.items;
        const isOpen = open?.index === index;
        const classes = ["context-menu-item", item.danger ? "danger" : "", isOpen ? "open" : ""]
          .filter(Boolean)
          .join(" ");

        return (
          <button
            key={index}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            type="button"
            role="menuitem"
            className={classes}
            disabled={item.disabled}
            aria-haspopup={isSubmenu ? "menu" : undefined}
            aria-expanded={isSubmenu ? isOpen : undefined}
            onMouseEnter={() => hover(index, isSubmenu)}
            onClick={(e) => {
              if (item.items) {
                // detail is 0 for Enter/Space, so only keyboard moves focus into the submenu
                openAt(index, e.detail === 0);
              } else {
                onClose(true);
                item.onSelect();
              }
            }}
          >
            {hasIcons && <span className="context-menu-icon">{item.icon && <Icon name={item.icon} type={item.iconType} />}</span>}
            <span className="context-menu-label">{item.label}</span>
            {isSubmenu && <Icon name="chevron-forward" className="context-menu-chevron" />}
          </button>
        );
      })}

      {open && (() => {
        const item = items[open.index];
        if (item === "divider" || !item.items) return null;
        const subItems: ContextMenuItem[] = item.items.length
          ? item.items
          : [{ label: "Empty", disabled: true, onSelect: () => {} }];
        return (
          <MenuList
            key={open.index}
            items={subItems}
            anchor={open.rect}
            autoFocus={open.focus}
            onClose={onClose}
            onBack={() => closeSubmenu(true)}
            onEnter={() => window.clearTimeout(timer.current)}
          />
        );
      })()}
    </div>
  );
}
