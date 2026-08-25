import { HTMLAttributes, ReactNode } from "react";

export function Page({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={["page", className].filter(Boolean).join(" ")} {...rest} />;
}

export interface PageHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, actions, className, ...rest }: PageHeaderProps) {
  return (
    <div className={["page-header", className].filter(Boolean).join(" ")} {...rest}>
      <h1>{title}</h1>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}
