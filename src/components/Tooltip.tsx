import { ReactNode } from "react";
import { useTooltip } from "./useTooltip";

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  const { triggerProps, bubble } = useTooltip(content);

  return (
    <span className="tooltip-wrap" {...triggerProps}>
      {children}
      {bubble}
    </span>
  );
}
