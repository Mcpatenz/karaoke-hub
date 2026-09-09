"use client";

import { type ReactNode, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  showClose?: boolean;
}

export default function Dialog({ open, onClose, title, children, showClose = true }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      previousFocus.current = document.activeElement as HTMLElement;
      document.body.style.overflow = "hidden";
      setTimeout(() => {
        dialogRef.current?.focus();
      }, 50);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
      if (previousFocus.current) {
        previousFocus.current.focus();
      }
    };
  }, [open, handleKeyDown]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[480px] max-h-[calc(100vh-32px)] overflow-hidden rounded-[var(--radius-sm)] border border-border-default bg-surface-muted shadow-2xl"
          >
            {showClose && (
              <button
                onClick={onClose}
                className="absolute right-4 top-4 z-10 grid h-8 w-8 place-items-center rounded-[var(--radius-xs)] text-text-tertiary transition-colors hover:bg-surface-raised hover:text-text-primary focus-visible:outline-2 focus-visible:outline-accent"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
