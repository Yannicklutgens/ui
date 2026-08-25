import { createContext, ReactNode, useCallback, useContext, useMemo, useRef, useState } from "react";

export type ToastTone = "neutral" | "success" | "danger";

interface ToastItem {
  id: number;
  message: ReactNode;
  tone: ToastTone;
}

interface ToastContextValue {
  showToast: (message: ReactNode, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const showToast = useCallback((message: ReactNode, tone: ToastTone = "neutral") => {
    const id = nextId.current++;
    setToasts((current) => [...current, { id, message, tone }]);
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, DEFAULT_DURATION_MS);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack">
        {toasts.map((toast) => {
          const toneClass = toast.tone === "neutral" ? "" : `toast-${toast.tone}`;
          return (
            <div key={toast.id} className={["toast", toneClass].filter(Boolean).join(" ")}>
              {toast.message}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
}
