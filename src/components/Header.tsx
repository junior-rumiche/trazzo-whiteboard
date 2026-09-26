"use client";

import React, { useState, useRef } from "react";
import {
  Brush,
  Grid,
  Trash2,
  Download,
  Upload,
  FolderKanban,
  HelpCircle,
  Plus,
  Check,
  Pencil,
  Sparkles,
} from "lucide-react";
import { useBoard } from "../context/BoardContext";
import { ExportModal } from "./ExportModal";
import { ShortcutsModal } from "./ShortcutsModal";
import { parseTrazzoFile } from "../lib/export";

export function Header() {
  const {
    activeBoard,
    boards,
    renameBoard,
    createNewBoard,
    clearCurrentBoard,
    importBoardsOrElements,
    gridEnabled,
    setGridEnabled,
    setIsBoardsSidebarOpen,
    showToast,
  } = useBoard();

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);

  // Inline rename of current board
  const [isRenaming, setIsRenaming] = useState(false);
  const [tempTitle, setTempTitle] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const startRename = () => {
    setTempTitle(activeBoard.name);
    setIsRenaming(true);
  };

  const saveRename = () => {
    if (tempTitle.trim()) {
      renameBoard(activeBoard.id, tempTitle.trim());
      showToast("Pizarra renombrada", "success");
    }
    setIsRenaming(false);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseTrazzoFile(text);
        importBoardsOrElements(parsed);
      } catch (err: any) {
        showToast(err.message || "Error al importar el archivo .trazzo", "error");
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      <header className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none select-none">
        {/* Left: Branding & Board Selector */}
        <div className="flex items-center gap-2 pointer-events-auto bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl p-1.5 px-3 rounded-2xl shadow-xl shadow-neutral-900/5 dark:shadow-black/40 border border-neutral-200/80 dark:border-neutral-800 text-neutral-800 dark:text-neutral-100 transition-all">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2 pr-2.5 border-r border-neutral-200 dark:border-neutral-800">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white shadow-sm shadow-indigo-500/25 flex items-center justify-center">
              <Brush size={15} />
            </div>
            <h1 className="font-bold text-sm tracking-tight text-neutral-900 dark:text-neutral-50 m-0 whitespace-nowrap">
              Trazzo <span className="text-indigo-600 dark:text-indigo-400 font-medium">Whiteboard</span>
            </h1>
          </div>

          {/* Current Board Name & Edit */}
          <div className="flex items-center gap-1.5 pl-0.5">
            {isRenaming ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveRename();
                    if (e.key === "Escape") setIsRenaming(false);
                  }}
                  autoFocus
                  className="px-2 py-0.5 text-xs font-medium rounded-lg border border-indigo-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none w-28 sm:w-32 focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  onClick={saveRename}
                  className="p-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                >
                  <Check size={12} />
                </button>
              </div>
            ) : (
              <button
                onClick={startRename}
                title="Click para renombrar esta pizarra"
                className="group flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 transition-colors max-w-[100px] sm:max-w-[140px] md:max-w-[180px]"
              >
                <span className="truncate">{activeBoard.name}</span>
                <Pencil size={11} className="text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </button>
            )}

            {/* Saved in local status pill */}
            <div className="hidden xl:flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Guardado en local</span>
            </div>

            <div className="w-[1px] h-4 bg-neutral-200 dark:bg-neutral-800 mx-0.5 hidden xl:block" />

            {/* Boards Manager button */}
            <button
              onClick={() => setIsBoardsSidebarOpen(true)}
              className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-xl text-xs font-medium bg-neutral-100/90 dark:bg-neutral-800/90 hover:bg-neutral-200/80 dark:hover:bg-neutral-700/80 text-neutral-700 dark:text-neutral-300 transition-colors"
              title="Abrir panel lateral de pizarras"
            >
              <FolderKanban size={13} className="text-indigo-500 shrink-0" />
              <span className="hidden sm:inline">Pizarras</span>
              <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-indigo-500 text-white">
                {boards.length}
              </span>
            </button>

            {/* Quick new board */}
            <button
              onClick={() => createNewBoard()}
              title="Crear nueva pizarra"
              className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
            >
              <Plus size={15} />
            </button>
          </div>
        </div>

        {/* Right: Actions, Export/Import, View & Theme */}
        <div className="flex items-center gap-0.5 sm:gap-1 pointer-events-auto bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl p-1 sm:p-1.5 px-2 rounded-2xl shadow-xl shadow-neutral-900/5 dark:shadow-black/40 border border-neutral-200/80 dark:border-neutral-800 text-neutral-800 dark:text-neutral-100 text-xs transition-all">
          {/* Grid Toggle */}
          <button
            onClick={() => setGridEnabled(!gridEnabled)}
            title={gridEnabled ? "Ocultar cuadrícula" : "Mostrar cuadrícula"}
            className={`hidden sm:flex p-1.5 sm:p-2 rounded-xl transition-all ${
              gridEnabled
                ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400"
                : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800 dark:hover:text-neutral-200"
            }`}
          >
            <Grid size={15} />
          </button>

          {/* Clear board */}
          <button
            onClick={clearCurrentBoard}
            title="Limpiar pizarra actual"
            className="p-1.5 sm:p-2 rounded-xl text-neutral-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
          >
            <Trash2 size={15} />
          </button>

          <div className="w-[1px] h-5 bg-neutral-200 dark:bg-neutral-800 mx-0.5" />

          {/* Quick Import (.trazzo) */}
          <label
            title="Importar archivo .trazzo"
            className="p-1.5 sm:p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-all flex items-center gap-1.5 font-medium"
          >
            <Upload size={14} />
            <span className="hidden lg:inline">Importar</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".trazzo,application/json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>

          {/* Export button */}
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white shadow-md shadow-indigo-500/25 transition-all text-xs"
          >
            <Download size={13} />
            <span>Exportar</span>
          </button>

          {/* Shortcuts / Help */}
          <button
            onClick={() => setIsShortcutsModalOpen(true)}
            title="Atajos de teclado y ayuda"
            className="p-2 rounded-xl text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800 dark:hover:text-neutral-200 transition-all"
          >
            <HelpCircle size={16} />
          </button>
        </div>
      </header>

      {/* Modals */}
      <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} />
      <ShortcutsModal isOpen={isShortcutsModalOpen} onClose={() => setIsShortcutsModalOpen(false)} />
    </>
  );
}
