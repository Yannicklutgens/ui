import { HTMLAttributes, ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "./Button";

export function Page({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={["page", className].filter(Boolean).join(" ")} {...rest} />;
}

export interface PageHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: ReactNode;
  actions?: ReactNode;
  /**
   * Back button in front of the title. It goes up the URL path, not back in the browser history:
   * `true` goes up one segment (/a/b/c -> /a/b), a number goes up that many (`2`: /1/2/3/4/5 -> /1/2/3),
   * and a string is the path to go to.
   */
  back?: boolean | number | string;
  /** Tooltip and aria-label of the back button. */
  backLabel?: string;
}

export function PageHeader({ title, actions, back, backLabel = "Back", className, ...rest }: PageHeaderProps) {
  const showBack = back !== undefined && back !== false;
  return (
    <div className={["page-header", className].filter(Boolean).join(" ")} {...rest}>
      <div className="page-header-title">
        {/* only rendered with `back`, so a PageHeader without it doesn't need a Router */}
        {showBack && <BackButton back={back === true ? 1 : back} label={backLabel} />}
        <h1>{title}</h1>
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

function BackButton({ back, label }: { back: number | string; label: string }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const target = typeof back === "string" ? back : parentPath(pathname, back);
  return <Button className="page-header-back" icon="arrow-back" borderless label={label} onClick={() => navigate(target)} />;
}

/** `pathname` without its last `depth` segments, never above "/". */
export function parentPath(pathname: string, depth = 1) {
  const segments = pathname.split("/").filter(Boolean);
  return "/" + segments.slice(0, Math.max(0, segments.length - Math.max(0, depth))).join("/");
}
