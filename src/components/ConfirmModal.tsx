"use client";

import React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

export interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
}

interface ConfirmModalProps {
  dialog: ConfirmDialogState | null;
  onClose: () => void;
}

export function ConfirmModal({ dialog, onClose }: ConfirmModalProps) {
  if (!dialog || !dialog.isOpen) return null;

  const isDanger = dialog.danger ?? true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm rounded-2xl shadow-2xl border bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-neutral-200/80 dark:border-neutral-800 text-neutral-800 dark:text-neutral-100 p-6 overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-2xl shrink-0 ${
              isDanger
                ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
                : "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
            }`}
          >
            {isDanger ? <Trash2 size={22} /> : <AlertTriangle size={22} />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-50 mb-1">
              {dialog.title}
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {dialog.message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1 -mr-2 -mt-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2.5 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 transition-colors"
          >
            {dialog.cancelLabel || "Cancelar"}
          </button>
          <button
            type="button"
            onClick={() => {
              dialog.onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-md transition-all ${
              isDanger
                ? "bg-rose-600 hover:bg-rose-700 shadow-rose-500/25"
                : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/25"
            }`}
          >
            {dialog.confirmLabel || "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
