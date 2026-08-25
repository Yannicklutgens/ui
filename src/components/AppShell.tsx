import { AnchorHTMLAttributes, HTMLAttributes, ReactNode } from "react";

export function AppShell({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={["app-shell", className].filter(Boolean).join(" ")} {...rest} />;
}

export function Sidebar({ className, ...rest }: HTMLAttributes<HTMLElement>) {
  return <aside className={["sidebar", className].filter(Boolean).join(" ")} {...rest} />;
}

export interface BrandProps extends HTMLAttributes<HTMLDivElement> {
  mark?: ReactNode;
}

export function Brand({ mark = "◆", className, children, ...rest }: BrandProps) {
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
