import { FocusEvent, MouseEvent, ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const GAP = 8;
const EDGE = 8;

interface Position {
  top: number;
  left: number;
  below: boolean;
}

/**
 * Shared tooltip behaviour: spread `triggerProps` on the element to hover and render `bubble`
 * anywhere. The bubble is portalled to document.body with fixed positioning, so it is not
 * clipped by scrolling or overflow-hidden parents such as Panels and Lists.
 */
export function useTooltip(content: ReactNode) {
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const bubbleRef = useRef<HTMLSpanElement>(null);

  const show = (e: MouseEvent<HTMLElement> | FocusEvent<HTMLElement>) =>
    setAnchor(e.currentTarget.getBoundingClientRect());
  // Mouse presses focus buttons in Firefox; re-rendering mid-click swallows the click,
  // so focus only shows the tooltip when it comes from the keyboard.
  const showOnFocus = (e: FocusEvent<HTMLElement>) => {
    if (e.currentTarget.matches(":focus-visible")) show(e);
  };
  const hide = () => {
    setAnchor(null);
    setPosition(null);
  };

  // Measure the bubble, then place it above the trigger (below when there is no room),
  // kept inside the viewport horizontally.
  useLayoutEffect(() => {
    if (!anchor || !bubbleRef.current) return;
    const { width, height } = bubbleRef.current.getBoundingClientRect();
    const below = anchor.top - GAP - height < EDGE;
    const center = anchor.left + anchor.width / 2;
    const left = Math.min(Math.max(center - width / 2, EDGE), window.innerWidth - width - EDGE);
    setPosition({ top: below ? anchor.bottom + GAP : anchor.top - GAP - height, left, below });
  }, [anchor]);

  // The anchor rect goes stale when the page moves, so just hide.
  useEffect(() => {
    if (!anchor) return;
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => {
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
    };
  }, [anchor]);

  const bubble =
    anchor && content !== undefined && content !== null && content !== ""
      ? createPortal(
          <span
            ref={bubbleRef}
            className="tooltip-bubble"
            role="tooltip"
            aria-hidden="true"
            style={
              position
                ? { top: position.top, left: position.left }
                : { top: 0, left: 0, visibility: "hidden" }
            }
          >
            {content}
          </span>,
          document.body,
        )
      : null;

  return {
    triggerProps: { onMouseEnter: show, onMouseLeave: hide, onFocus: showOnFocus, onBlur: hide },
    bubble,
  };
}
