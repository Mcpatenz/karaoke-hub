"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, XCircle, X } from "lucide-react";

type ToastType = "success" | "error";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2"
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      role="status"
      className={[
        "flex items-center gap-3 rounded-[var(--radius-sm)] border px-4 py-3 text-sm font-medium shadow-lg backdrop-blur-md",
        toast.type === "success"
          ? "border-status-success/20 bg-surface-raised/90 text-status-success"
          : "border-status-error/20 bg-surface-raised/90 text-status-error",
      ].join(" ")}
    >
      {toast.type === "success" ? (
        <CheckCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
      ) : (
        <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
      )}
      <span className="text-text-primary">{toast.message}</span>
      <button
        onClick={onDismiss}
        className="ml-2 shrink-0 text-text-tertiary hover:text-text-primary"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}
