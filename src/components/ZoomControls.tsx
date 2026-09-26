"use client";

import React from "react";
import { ZoomIn, ZoomOut, RotateCcw, Grid, Hand, Undo2, Redo2 } from "lucide-react";
import { useBoard } from "../context/BoardContext";

export function ZoomControls() {
  const {
    viewTransform,
    setZoom,
    resetZoom,
    gridEnabled,
    setGridEnabled,
    activeTool,
    setActiveTool,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useBoard();

  const percentage = Math.round(viewTransform.zoom * 100);
  const isHandActive = activeTool === "hand";

  const toggleHandTool = () => {
    setActiveTool(isHandActive ? "select" : "hand");
  };

  return (
    <div className="absolute bottom-4 right-4 sm:bottom-5 sm:right-5 z-20 flex items-center gap-1 p-1 px-1.5 rounded-2xl shadow-xl shadow-neutral-900/5 dark:shadow-black/40 backdrop-blur-xl transition-all border bg-white/90 text-neutral-800 border-neutral-200/80 dark:bg-neutral-900/90 dark:text-neutral-100 dark:border-neutral-800 text-xs select-none">
      {/* Undo & Redo */}
      <button
        onClick={undo}
        disabled={!canUndo}
        title="Deshacer (Ctrl + Z)"
        className={`p-1.5 rounded-xl transition-all ${
          canUndo
            ? "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
            : "opacity-30 cursor-not-allowed text-neutral-400"
        }`}
      >
        <Undo2 size={14} />
      </button>

      <button
        onClick={redo}
        disabled={!canRedo}
        title="Rehacer (Ctrl + Y)"
        className={`p-1.5 rounded-xl transition-all ${
          canRedo
            ? "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
            : "opacity-30 cursor-not-allowed text-neutral-400"
        }`}
      >
        <Redo2 size={14} />
      </button>

      <div className="w-[1px] h-4 bg-neutral-200 dark:bg-neutral-800 mx-0.5" />

      {/* Canvas Pan Helper */}
      <button
        onClick={toggleHandTool}
        title={
          isHandActive
            ? "Desactivar modo mano (H)"
            : "Mano para desplazar lienzo (H / Espacio + Arrastre)"
        }
        className={`p-1.5 rounded-xl transition-all ${
          isHandActive
            ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 font-semibold shadow-xs"
            : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800 dark:hover:text-neutral-200"
        }`}
      >
        <Hand size={14} />
      </button>

      <div className="w-[1px] h-4 bg-neutral-200 dark:bg-neutral-800 mx-0.5" />

      {/* Zoom In & Out */}
      <button
        onClick={() => setZoom(viewTransform.zoom - 0.1)}
        title="Alejar (Ctrl + -)"
        className="p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
      >
        <ZoomOut size={14} />
      </button>

      <button
        onClick={resetZoom}
        title="Restablecer zoom al 100%"
        className="px-2 py-0.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 font-semibold font-mono text-[11px] min-w-[44px] text-center text-neutral-700 dark:text-neutral-300 transition-colors"
      >
        {percentage}%
      </button>

      <button
        onClick={() => setZoom(viewTransform.zoom + 0.1)}
        title="Acercar (Ctrl + +)"
        className="p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
      >
        <ZoomIn size={14} />
      </button>

      <div className="w-[1px] h-4 bg-neutral-200 dark:bg-neutral-800 mx-0.5" />

      {/* Center View */}
      <button
        onClick={resetZoom}
        title="Centrar contenido en pantalla (Shift + 1)"
        className="p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
      >
        <RotateCcw size={13} />
      </button>

      <div className="w-[1px] h-4 bg-neutral-200 dark:bg-neutral-800 mx-0.5" />

      {/* Grid Toggle */}
      <button
        onClick={() => setGridEnabled(!gridEnabled)}
        title={gridEnabled ? "Ocultar cuadrícula" : "Mostrar cuadrícula"}
        className={`p-1.5 rounded-xl transition-all ${
          gridEnabled
            ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400"
            : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800 dark:hover:text-neutral-200"
        }`}
      >
        <Grid size={13} />
      </button>
    </div>
  );
}
