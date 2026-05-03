"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm [animation:sf-fade-in_120ms_ease]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "w-full max-w-lg bg-bg rounded-xl shadow-lg p-6 [animation:sf-modal-in_180ms_ease]",
          className
        )}
      >
        <div className="flex items-start justify-between mb-4">
          {title ? (
            <h2 className="text-xl font-semibold text-text-primary pr-4">
              {title}
            </h2>
          ) : (
            <span aria-hidden />
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ml-auto -m-1 p-1 rounded-md text-text-secondary hover:bg-surface transition"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
