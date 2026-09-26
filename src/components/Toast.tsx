"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "info" | "success" | "warning" | "error";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 max-w-md w-full px-4 pointer-events-none">
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 className="text-emerald-500 shrink-0" size={16} />,
          warning: <AlertTriangle className="text-amber-500 shrink-0" size={16} />,
          error: <AlertCircle className="text-rose-500 shrink-0" size={16} />,
          info: <Info className="text-indigo-500 shrink-0" size={16} />,
        };

        const borders = {
          success: "border-emerald-200 dark:border-emerald-800/60 shadow-emerald-500/5",
          warning: "border-amber-200 dark:border-amber-800/60 shadow-amber-500/5",
          error: "border-rose-200 dark:border-rose-800/60 shadow-rose-500/5",
          info: "border-indigo-200 dark:border-indigo-800/60 shadow-indigo-500/5",
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-2.5 py-2.5 px-4 rounded-2xl shadow-2xl backdrop-blur-2xl bg-white/95 dark:bg-neutral-900/95 text-neutral-800 dark:text-neutral-100 border ${borders[toast.type]} transition-all animate-in fade-in slide-in-from-bottom-2 duration-150`}
          >
            <div>{icons[toast.type]}</div>
            <div className="text-xs font-medium tracking-tight whitespace-nowrap">{toast.message}</div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-0.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ml-1"
            >
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
