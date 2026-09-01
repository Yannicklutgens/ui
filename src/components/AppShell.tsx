import { AnchorHTMLAttributes, ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

export function AppShell({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={["app-shell", className].filter(Boolean).join(" ")} {...rest} />;
}

export interface SidebarProps extends HTMLAttributes<HTMLElement> {
  open?: boolean;
}

export function Sidebar({ open, className, ...rest }: SidebarProps) {
  const classes = ["sidebar", open ? "open" : "", className].filter(Boolean).join(" ");
  return <aside className={classes} {...rest} />;
}

export interface SidebarBackdropProps extends HTMLAttributes<HTMLDivElement> {
  open?: boolean;
}

export function SidebarBackdrop({ open, className, ...rest }: SidebarBackdropProps) {
  const classes = ["sidebar-backdrop", open ? "open" : "", className].filter(Boolean).join(" ");
  return <div className={classes} aria-hidden="true" {...rest} />;
}

export function MobileTopbar({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={["mobile-topbar", className].filter(Boolean).join(" ")} {...rest} />;
}

export function MenuButton({ className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={["menu-button", className].filter(Boolean).join(" ")}
      aria-label="Toggle menu"
      {...rest}
    >
      <span className="menu-button-bars">
        <span />
        <span />
        <span />
      </span>
    </button>
  );
}

export interface BrandProps extends HTMLAttributes<HTMLDivElement> {
  mark?: ReactNode;
}

const defaultMark = (
  <svg viewBox="0 0 600 600" fill="none" width="1em" height="1em" aria-hidden="true">
    <rect width="600" height="600" rx="175" fill="currentColor" fillOpacity="0.15" />
    <rect x="12.5" y="12.5" width="575" height="575" rx="162.5" stroke="currentColor" strokeOpacity="0.3" strokeWidth="25" />
    <rect x="300" y="162" width="195.161" height="195.161" rx="10" transform="rotate(45 300 162)" fill="currentColor" />
  </svg>
);

export function Brand({ mark = defaultMark, className, children, ...rest }: BrandProps) {
  return (
    <div className={["brand", className].filter(Boolean).join(" ")} {...rest}>
      <span className="brand-mark">{mark}</span>
      {children}
    </div>
  );
}

export function SidebarNav({ className, ...rest }: HTMLAttributes<HTMLElement>) {
  return <nav className={["sidebar-nav", className].filter(Boolean).join(" ")} {...rest} />;
}

export interface NavItemProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  active?: boolean;
}

export function NavItem({ active, className, ...rest }: NavItemProps) {
  const classes = ["nav-link", active ? "active" : "", className].filter(Boolean).join(" ");
  return <a className={classes} {...rest} />;
}

export function SidebarUser({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={["sidebar-user", className].filter(Boolean).join(" ")} {...rest} />;
}

export function Content({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={["content", className].filter(Boolean).join(" ")} {...rest} />;
}
