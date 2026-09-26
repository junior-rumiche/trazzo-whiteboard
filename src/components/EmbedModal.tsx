"use client";

import React, { useState, useEffect, useRef } from "react";
import { Globe, X, ExternalLink } from "lucide-react";

interface EmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEmbed: (url: string, title?: string) => void;
}

export function EmbedModal({ isOpen, onClose, onEmbed }: EmbedModalProps) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setUrl("");
      setTitle("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let cleanUrl = url.trim();
    if (!cleanUrl) return;

    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = "https://" + cleanUrl;
    }

    onEmbed(cleanUrl, title.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl shadow-2xl border bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-neutral-200/80 dark:border-neutral-800 text-neutral-800 dark:text-neutral-100 p-6 overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
              <Globe size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-50">
                Incrustar enlace web
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Añade una tarjeta interactiva de cualquier sitio web al lienzo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1 -mr-2 -mt-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              URL del enlace web
            </label>
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://ejemplo.com o figma.com..."
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/90 text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Título personalizado <span className="font-normal opacity-60">(opcional)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Documentación de la API"
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/90 text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!url.trim()}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-md shadow-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
            >
              <ExternalLink size={14} />
              <span>Incrustar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
