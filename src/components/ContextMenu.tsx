"use client";

import React, { useEffect, useRef } from "react";
import {
  ArrowUpToLine,
  ArrowDownToLine,
  ArrowUp,
  ArrowDown,
  Copy,
  Scissors,
  Clipboard,
  Trash2,
  Image as ImageIcon,
  CheckSquare,
  Download,
  RotateCcw,
} from "lucide-react";
import { useBoard } from "../context/BoardContext";

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  targetElementId?: string | null;
  onTriggerInsertImage: () => void;
}

export function ContextMenu({
  x,
  y,
  onClose,
  targetElementId,
  onTriggerInsertImage,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);

  const {
    selectedIds,
    setSelectedIds,
    elements,
    bringToFront,
    sendToBack,
    moveForward,
    moveBackward,
    duplicateSelectedElements,
    deleteSelectedElements,
    copySelectedElements,
    cutSelectedElements,
    pasteElements,
    clearCurrentBoard,
    showToast,
  } = useBoard();

  const selectedElements = elements.filter((el) => selectedIds.includes(el.id));
  const hasSelection = selectedElements.length > 0;
  const isImageSelected = selectedElements.length === 1 && selectedElements[0].type === "image";

  // Close on outside click or escape
  useEffect(() => {
    const handleDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("mousedown", handleDown);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("mousedown", handleDown);
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  // Adjust position so menu doesn't bleed off screen edges
  const menuWidth = 220;
  const menuHeight = hasSelection ? 340 : 210;
  const posX = typeof window !== "undefined" ? Math.min(x, window.innerWidth - menuWidth - 10) : x;
  const posY = typeof window !== "undefined" ? Math.min(y, window.innerHeight - menuHeight - 10) : y;

  const handleDownloadSelectedImage = () => {
    if (!isImageSelected) return;
    const imgEl = selectedElements[0] as any;
    if (!imgEl.src) return;
    const a = document.createElement("a");
    a.href = imgEl.src;
    a.download = `trazzo-imagen-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast("Imagen descargada", "success");
    onClose();
  };

  return (
    <div
      ref={menuRef}
      style={{ left: `${Math.max(10, posX)}px`, top: `${Math.max(10, posY)}px` }}
      className="fixed z-50 w-56 rounded-2xl p-1.5 shadow-2xl backdrop-blur-xl bg-white/95 dark:bg-neutral-900/95 border border-neutral-200/90 dark:border-neutral-800 text-neutral-800 dark:text-neutral-100 text-xs font-medium animate-in fade-in zoom-in-95 duration-100"
    >
      {hasSelection ? (
        <>
          {/* Layer Ordering Section */}
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            Orden de Capas
          </div>

          <button
            onClick={() => {
              bringToFront();
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-400 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ArrowUpToLine size={14} />
              <span>Traer al frente</span>
            </span>
            <kbd className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">Ctrl+]</kbd>
          </button>

          <button
            onClick={() => {
              moveForward();
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ArrowUp size={14} />
              <span>Subir una capa</span>
            </span>
            <kbd className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">]</kbd>
          </button>

          <button
            onClick={() => {
              moveBackward();
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ArrowDown size={14} />
              <span>Bajar una capa</span>
            </span>
            <kbd className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">[</kbd>
          </button>

          <button
            onClick={() => {
              sendToBack();
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-400 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ArrowDownToLine size={14} />
              <span>Enviar al fondo</span>
            </span>
            <kbd className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">Ctrl+[</kbd>
          </button>

          <div className="my-1 border-t border-neutral-100 dark:border-neutral-800/80" />

          {/* Image-specific action */}
          {isImageSelected && (
            <>
              <button
                onClick={handleDownloadSelectedImage}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Download size={14} className="text-indigo-500" />
                  <span>Descargar imagen</span>
                </span>
              </button>
              <div className="my-1 border-t border-neutral-100 dark:border-neutral-800/80" />
            </>
          )}

          {/* Edit Actions */}
          <button
            onClick={() => {
              copySelectedElements();
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Copy size={14} />
              <span>Copiar</span>
            </span>
            <kbd className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">Ctrl+C</kbd>
          </button>

          <button
            onClick={() => {
              cutSelectedElements();
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Scissors size={14} />
              <span>Cortar</span>
            </span>
            <kbd className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">Ctrl+X</kbd>
          </button>

          <button
            onClick={() => {
              duplicateSelectedElements();
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Clipboard size={14} />
              <span>Duplicar</span>
            </span>
            <kbd className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">Ctrl+D</kbd>
          </button>

          <div className="my-1 border-t border-neutral-100 dark:border-neutral-800/80" />

          <button
            onClick={() => {
              deleteSelectedElements();
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors text-rose-500"
          >
            <span className="flex items-center gap-2">
              <Trash2 size={14} />
              <span>Eliminar</span>
            </span>
            <kbd className="text-[10px] text-rose-400/80 font-mono">Supr</kbd>
          </button>
        </>
      ) : (
        <>
          {/* Canvas Space Context Actions */}
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            Lienzo
          </div>

          <button
            onClick={() => {
              onClose();
              onTriggerInsertImage();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-400 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ImageIcon size={14} />
              <span>Insertar imagen...</span>
            </span>
            <kbd className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">I</kbd>
          </button>

          <button
            onClick={() => {
              pasteElements();
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Clipboard size={14} />
              <span>Pegar</span>
            </span>
            <kbd className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">Ctrl+V</kbd>
          </button>

          <button
            onClick={() => {
              setSelectedIds(elements.filter((el) => !el.isDeleted).map((el) => el.id));
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <span className="flex items-center gap-2">
              <CheckSquare size={14} />
              <span>Seleccionar todo</span>
            </span>
            <kbd className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">Ctrl+A</kbd>
          </button>

          <div className="my-1 border-t border-neutral-100 dark:border-neutral-800/80" />

          <button
            onClick={() => {
              clearCurrentBoard();
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors text-rose-500"
          >
            <span className="flex items-center gap-2">
              <Trash2 size={14} />
              <span>Limpiar pizarra...</span>
            </span>
          </button>
        </>
      )}
    </div>
  );
}
