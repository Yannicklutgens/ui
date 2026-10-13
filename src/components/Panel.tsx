import { CSSProperties, HTMLAttributes, ReactNode, useEffect, useRef, useState } from "react";

export interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  /** Toolbar content on the left side of the header, e.g. buttons. */
  headerStart?: ReactNode;
  /** Toolbar content on the right side of the header, e.g. buttons. */
  headerEnd?: ReactNode;
  /** Content on the left side of the footer, e.g. buttons. */
  footerStart?: ReactNode;
  /** Content on the right side of the footer, e.g. buttons. */
  footerEnd?: ReactNode;
  /** Drop the body padding for edge-to-edge content. Tables and Lists are flush automatically. */
  flush?: boolean;
  /** Render the body in a theme scope, e.g. "light" for content designed for a white background. */
  bodyTheme?: "light" | "dark";
  /**
   * "page" (default): the panel grows with its content and the page scrolls.
   * "panel": the panel fits the viewport (or `maxHeight`) and its body scrolls.
   */
  scroll?: "page" | "panel";
  /** Max height for `scroll="panel"`, e.g. "60vh" or 400. Defaults to the space left in the viewport. */
  maxHeight?: string | number;
}

/** Bordered box around content, with optional header and footer toolbars. */
export function Panel({
  headerStart,
  headerEnd,
  footerStart,
  footerEnd,
  flush,
  bodyTheme,
  scroll = "page",
  maxHeight,
  className,
  style,
  children,
  ...rest
}: PanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState(0);
  const fitViewport = scroll === "panel" && maxHeight === undefined;

  // distance from the top of the document, so the panel fits below whatever is above it
  useEffect(() => {
    if (!fitViewport) return;
    const measure = () => {
      if (ref.current) setTop(ref.current.getBoundingClientRect().top + window.scrollY);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [fitViewport]);

  const scrollStyle =
    scroll === "panel"
      ? ({
          "--panel-max-height": fitViewport
            ? `calc(100dvh - ${top}px - var(--panel-gap, 24px))`
            : typeof maxHeight === "number"
              ? `${maxHeight}px`
              : maxHeight,
        } as CSSProperties)
      : undefined;

  const classes = ["panel", scroll === "panel" ? "panel-scroll" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={ref} className={classes} style={{ ...scrollStyle, ...style }} {...rest}>
      {(headerStart || headerEnd) && (
        <div className="panel-header">
          {headerStart && <div className="panel-header-start">{headerStart}</div>}
          {headerEnd && <div className="panel-header-end">{headerEnd}</div>}
        </div>
      )}
      <div
        className={["panel-body", flush ? "panel-body-flush" : "", bodyTheme ? `theme-${bodyTheme}` : ""]
          .filter(Boolean)
          .join(" ")}
      >{children}</div>
      {(footerStart || footerEnd) && (
        <div className="panel-footer">
          {footerStart && <div className="panel-footer-start">{footerStart}</div>}
          {footerEnd && <div className="panel-footer-end">{footerEnd}</div>}
        </div>
      )}
    </div>
  );
}

/** @deprecated Use Panel. */
export const TableWrap = Panel;
