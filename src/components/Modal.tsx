import { HTMLAttributes, MouseEvent, ReactNode } from "react";

export interface ModalOverlayProps extends HTMLAttributes<HTMLDivElement> {
  onDismiss?: () => void;
}

export function ModalOverlay({ onDismiss, className, children, ...rest }: ModalOverlayProps) {
  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onDismiss?.();
  };

  return (
    <div className={["modal-overlay", className].filter(Boolean).join(" ")} onClick={handleClick} {...rest}>
      {children}
    </div>
  );
}

export function ModalCard({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={["modal-card", className].filter(Boolean).join(" ")} {...rest} />;
}

export interface ModalProps {
  onDismiss?: () => void;
  children: ReactNode;
}

export function Modal({ onDismiss, children }: ModalProps) {
  return (
    <ModalOverlay onDismiss={onDismiss}>
      <ModalCard>{children}</ModalCard>
    </ModalOverlay>
  );
}
