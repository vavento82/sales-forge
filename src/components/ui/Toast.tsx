"use client";

import * as React from "react";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: number;
  type: ToastType;
  title?: string;
  message: string;
}

interface ToastContextValue {
  toast: (t: Omit<Toast, "id">) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

let toastIdCounter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const dismiss = React.useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback(
    (t: Omit<Toast, "id">) => {
      const id = ++toastIdCounter;
      setToasts((prev) => [...prev, { ...t, id }]);
      window.setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );

  const value: ToastContextValue = React.useMemo(
    () => ({
      toast,
      success: (message, title) => toast({ type: "success", message, title }),
      error: (message, title) => toast({ type: "error", message, title }),
      warning: (message, title) => toast({ type: "warning", message, title }),
      info: (message, title) => toast({ type: "info", message, title }),
    }),
    [toast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="fixed top-4 right-4 z-[200] flex flex-col gap-2 w-[min(360px,calc(100vw-2rem))]"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const typeConfig: Record<ToastType, { icon: LucideIcon; color: string }> = {
  success: { icon: CheckCircle2, color: "text-success" },
  error: { icon: AlertCircle, color: "text-error" },
  warning: { icon: AlertTriangle, color: "text-warning" },
  info: { icon: Info, color: "text-blue-500" },
};

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  const cfg = typeConfig[toast.type];
  const Icon = cfg.icon;
  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-3 bg-bg rounded-lg shadow-lg border border-border",
        "p-3.5 [animation:sf-toast-in_180ms_ease]"
      )}
    >
      <Icon size={20} className={cn("mt-0.5 shrink-0", cfg.color)} />
      <div className="flex-1 min-w-0">
        {toast.title && (
          <div className="text-sm font-semibold text-text-primary mb-0.5">
            {toast.title}
          </div>
        )}
        <div className="text-[13px] text-text-secondary leading-relaxed">
          {toast.message}
        </div>
      </div>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="text-text-secondary hover:text-text-primary -m-1 p-1"
      >
        <X size={16} />
      </button>
    </div>
  );
}
