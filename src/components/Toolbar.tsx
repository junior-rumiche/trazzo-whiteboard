"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Lock,
  LockOpen,
  MousePointer,
  Hand,
  Square,
  Diamond,
  Circle,
  ArrowRight,
  Minus,
  Pencil,
  Type,
  Image as ImageIcon,
  Eraser,
  Undo2,
  Redo2,
  MoreHorizontal,
  Frame,
  Globe,
  Sparkles,
  Zap,
  PaintBucket,
  Lasso,
} from "lucide-react";
import { useBoard } from "../context/BoardContext";
import { Tool } from "../types/canvas";

interface ToolItem {
  id: Tool;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  shortcut: string;
}

const TOOLS: ToolItem[] = [
  { id: "hand", label: "Mano (Desplazar)", icon: Hand, shortcut: "H" },
  { id: "select", label: "Selección", icon: MousePointer, shortcut: "V" },
  { id: "rectangle", label: "Rectángulo", icon: Square, shortcut: "R" },
  { id: "diamond", label: "Rombo", icon: Diamond, shortcut: "D" },
  { id: "ellipse", label: "Círculo / Elipse", icon: Circle, shortcut: "O" },
  { id: "arrow", label: "Flecha Conectora", icon: ArrowRight, shortcut: "A" },
  { id: "line", label: "Línea Conectora", icon: Minus, shortcut: "L" },
  { id: "pencil", label: "Lápiz a mano alzada", icon: Pencil, shortcut: "P" },
  { id: "text", label: "Texto", icon: Type, shortcut: "T" },
  { id: "eraser", label: "Borrador", icon: Eraser, shortcut: "E" },
];

interface OverflowToolItem {
  id: Tool | "embed";
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  shortcut: string;
}

const OVERFLOW_TOOLS: OverflowToolItem[] = [
  { id: "image", label: "Insertar imagen", icon: ImageIcon, shortcut: "9 / I" },
  { id: "frame", label: "Herramienta de marco", icon: Frame, shortcut: "F" },
  { id: "embed", label: "Incrustar web", icon: Globe, shortcut: "" },
  { id: "draw-to-shape", label: "Dibujar a forma", icon: Sparkles, shortcut: "Shift+X" },
  { id: "laser", label: "Puntero láser", icon: Zap, shortcut: "K" },
  { id: "bucket", label: "Bote de pintura", icon: PaintBucket, shortcut: "B" },
  { id: "lasso", label: "Selección de lazo", icon: Lasso, shortcut: "" },
];

export function Toolbar() {
  const {
    activeTool,
    setActiveTool,
    isToolLocked,
    toggleToolLock,
    undo,
    redo,
    canUndo,
    canRedo,
    insertImageFile,
    setIsEmbedModalOpen,
  } = useBoard();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);

  // Close more menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMoreMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleToolClick = (toolId: Tool) => {
    setActiveTool(toolId);
  };

  const handleOverflowToolClick = (toolId: Tool | "embed") => {
    setIsMoreMenuOpen(false);
    if (toolId === "image") {
      fileInputRef.current?.click();
      return;
    }
    if (toolId === "embed") {
      setIsEmbedModalOpen(true);
      return;
    }
    setActiveTool(toolId as Tool);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      insertImageFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const activeOverflowItem = OVERFLOW_TOOLS.find((t) => t.id === activeTool);

  return (
    <div className="absolute top-16 md:top-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 pointer-events-none select-none max-w-[calc(100vw-1.5rem)]">
      {/* Top Toolbar Floating Island */}
      <div className="pointer-events-auto flex items-center gap-0.5 sm:gap-1 p-1 sm:p-1.5 rounded-2xl shadow-2xl shadow-neutral-900/10 dark:shadow-black/50 backdrop-blur-xl transition-all duration-200 border bg-white/95 text-neutral-800 border-neutral-200/80 dark:bg-neutral-900/95 dark:text-neutral-100 dark:border-neutral-800 overflow-visible relative">
        {/* Lock Tool Toggle */}
        <button
          onClick={toggleToolLock}
          title={
            isToolLocked
              ? "Herramienta bloqueada: se mantiene activa después de dibujar (Q)"
              : "Bloquear herramienta: mantener activa después de dibujar (Q)"
          }
          className={`relative group p-2 sm:p-2.5 rounded-xl transition-all duration-150 flex items-center justify-center shrink-0 ${
            isToolLocked
              ? "bg-indigo-50 border border-indigo-400/80 text-indigo-600 dark:bg-indigo-950/60 dark:border-indigo-500/50 dark:text-indigo-400 shadow-xs"
              : "hover:bg-neutral-100 dark:hover:bg-neutral-800/80 text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
          }`}
        >
          {isToolLocked ? <Lock size={17} /> : <LockOpen size={17} />}
          <div className="absolute top-full mt-2.5 hidden group-hover:flex flex-col items-center pointer-events-none z-30 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-2.5 py-1 text-[11px] font-medium rounded-lg whitespace-nowrap bg-neutral-900/95 text-neutral-100 dark:bg-neutral-800/95 dark:text-neutral-100 shadow-xl border border-neutral-800 dark:border-neutral-700/60 backdrop-blur-sm">
              {isToolLocked ? "Herramienta fija" : "Bloquear herramienta"}{" "}
              <span className="opacity-50 text-[10px] ml-1">(Q)</span>
            </div>
          </div>
        </button>

        <div className="w-[1px] h-6 bg-neutral-200 dark:bg-neutral-800 mx-0.5 shrink-0" />

        {/* Main Tools list */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => handleToolClick(tool.id)}
                title={`${tool.label} (${tool.shortcut})`}
                className={`relative group p-2 sm:p-2.5 rounded-xl transition-all duration-150 flex items-center justify-center shrink-0 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30 scale-[1.04]"
                    : "hover:bg-neutral-100 dark:hover:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 active:scale-95"
                }`}
              >
                <Icon size={18} />
                <div className="absolute top-full mt-2.5 hidden group-hover:flex flex-col items-center pointer-events-none z-30 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2.5 py-1 text-[11px] font-medium rounded-lg whitespace-nowrap bg-neutral-900/95 text-neutral-100 dark:bg-neutral-800/95 dark:text-neutral-100 shadow-xl border border-neutral-800 dark:border-neutral-700/60 backdrop-blur-sm">
                    {tool.label} <span className="opacity-50 text-[10px] ml-1">({tool.shortcut})</span>
                  </div>
                </div>
              </button>
            );
          })}

          {/* 3-dots Overflow Menu Button */}
          <div className="relative shrink-0" ref={moreMenuRef}>
            <button
              onClick={() => setIsMoreMenuOpen((prev) => !prev)}
              title={
                activeOverflowItem
                  ? `Más herramientas (${activeOverflowItem.label})`
                  : "Más herramientas"
              }
              className={`relative group p-2 sm:p-2.5 rounded-xl transition-all duration-150 flex items-center justify-center ${
                isMoreMenuOpen || Boolean(activeOverflowItem)
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30 scale-[1.04]"
                  : "hover:bg-neutral-100 dark:hover:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 active:scale-95"
              }`}
            >
              <MoreHorizontal size={18} />
              {activeOverflowItem && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-neutral-900" />
              )}
              {!isMoreMenuOpen && (
                <div className="absolute top-full mt-2.5 hidden group-hover:flex flex-col items-center pointer-events-none z-30 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2.5 py-1 text-[11px] font-medium rounded-lg whitespace-nowrap bg-neutral-900/95 text-neutral-100 dark:bg-neutral-800/95 dark:text-neutral-100 shadow-xl border border-neutral-800 dark:border-neutral-700/60 backdrop-blur-sm">
                    {activeOverflowItem ? `Activa: ${activeOverflowItem.label}` : "Más herramientas"}
                  </div>
                </div>
              )}
            </button>

            {/* 3-dots Dropdown Menu Popover */}
            {isMoreMenuOpen && (
              <div className="absolute top-full mt-2.5 -right-2 sm:left-1/2 sm:-translate-x-1/2 w-64 p-1.5 rounded-2xl shadow-2xl shadow-neutral-900/20 dark:shadow-black/70 backdrop-blur-2xl border bg-white dark:bg-neutral-900 text-neutral-800 border-neutral-200 dark:text-neutral-100 dark:border-neutral-800 z-50 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 border-b border-neutral-100 dark:border-neutral-800/80 mb-0.5">
                  Herramientas adicionales
                </div>
                {OVERFLOW_TOOLS.map((item) => {
                  const Icon = item.icon;
                  const isItemActive = activeTool === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleOverflowToolClick(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        isItemActive
                          ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200/50 dark:border-indigo-800/50"
                          : "hover:bg-neutral-100 dark:hover:bg-neutral-800/80 text-neutral-700 dark:text-neutral-200"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          size={16}
                          className={
                            isItemActive
                              ? "text-indigo-600 dark:text-indigo-400"
                              : "text-neutral-500 dark:text-neutral-400"
                          }
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.shortcut && (
                        <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400">
                          {item.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Hidden file input for image insertion */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />

        <div className="w-[1px] h-6 bg-neutral-200 dark:bg-neutral-800 mx-1 shrink-0" />

        {/* History buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={undo}
            disabled={!canUndo}
            title="Deshacer (Ctrl+Z)"
            className={`p-2 sm:p-2.5 rounded-xl transition-all flex items-center justify-center ${
              canUndo
                ? "hover:bg-neutral-100 dark:hover:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
                : "opacity-30 cursor-not-allowed text-neutral-400"
            }`}
          >
            <Undo2 size={18} />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            title="Rehacer (Ctrl+Y)"
            className={`p-2 sm:p-2.5 rounded-xl transition-all flex items-center justify-center ${
              canRedo
                ? "hover:bg-neutral-100 dark:hover:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
                : "opacity-30 cursor-not-allowed text-neutral-400"
            }`}
          >
            <Redo2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
