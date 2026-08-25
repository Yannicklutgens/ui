import { HTMLAttributes, ReactNode } from "react";

export function StatGrid({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={["stat-grid", className].filter(Boolean).join(" ")} {...rest} />;
}

export interface StatTileProps extends HTMLAttributes<HTMLDivElement> {
  value: ReactNode;
  label: ReactNode;
}

export function StatTile({ value, label, className, ...rest }: StatTileProps) {
  return (
    <div className={["stat-tile", className].filter(Boolean).join(" ")} {...rest}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
