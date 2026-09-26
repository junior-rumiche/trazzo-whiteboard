"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  Plus,
  Copy,
  Trash2,
  Edit2,
  Check,
  FolderKanban,
  Calendar,
  Layers,
  ChevronLeft,
  Search,
  Sparkles,
  LayoutGrid,
} from "lucide-react";
import { useBoard } from "../context/BoardContext";
import { TrazzoElement } from "../types/canvas";
import { getCombinedBounds } from "../lib/geometry";

interface BoardsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function BoardThumbnail({ elements }: { elements: TrazzoElement[] }) {
  const activeElements = useMemo(() => elements.filter((el) => !el.isDeleted), [elements]);

  if (activeElements.length === 0) {
    return (
      <div className="w-12 h-10 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-100/60 dark:bg-neutral-800/60 flex items-center justify-center shrink-0">
        <LayoutGrid size={14} className="text-neutral-400 dark:text-neutral-500" />
      </div>
    );
  }

  const bounds = getCombinedBounds(activeElements);
  if (!bounds || bounds.width <= 0 || bounds.height <= 0) {
    return (
      <div className="w-12 h-10 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-100/60 dark:bg-neutral-800/60 flex items-center justify-center shrink-0">
        <LayoutGrid size={14} className="text-neutral-400" />
      </div>
    );
  }

  const padding = 12;
  const vbX = bounds.minX - padding;
  const vbY = bounds.minY - padding;
  const vbW = Math.max(bounds.width + padding * 2, 20);
  const vbH = Math.max(bounds.height + padding * 2, 20);

  return (
    <div className="w-12 h-10 rounded-lg border border-neutral-200/80 dark:border-neutral-700/80 bg-white/80 dark:bg-neutral-800/80 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
      <svg
        viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
        className="w-full h-full p-0.5 pointer-events-none"
      >
        {activeElements.slice(0, 15).map((el, i) => {
          if (
            el.type === "rectangle" ||
            el.type === "image" ||
            el.type === "frame" ||
            el.type === "embed"
          ) {
            const x = Math.min(el.x, el.x + el.width);
            const y = Math.min(el.y, el.y + el.height);
            const w = Math.abs(el.width);
            const h = Math.abs(el.height);
            return (
              <rect
                key={el.id || i}
                x={x}
                y={y}
                width={w}
                height={h}
                fill={el.fillColor !== "transparent" ? el.fillColor : "none"}
                stroke={el.strokeColor || "#6366f1"}
                strokeWidth={Math.max(2, (vbW / 60) * 1.5)}
                opacity={el.opacity || 0.8}
                rx={4}
              />
            );
          }
          if (el.type === "ellipse") {
            const cx = el.x + el.width / 2;
            const cy = el.y + el.height / 2;
            const rx = Math.abs(el.width) / 2;
            const ry = Math.abs(el.height) / 2;
            return (
              <ellipse
                key={el.id || i}
                cx={cx}
                cy={cy}
                rx={rx}
                ry={ry}
                fill={el.fillColor !== "transparent" ? el.fillColor : "none"}
                stroke={el.strokeColor || "#10b981"}
                strokeWidth={Math.max(2, (vbW / 60) * 1.5)}
                opacity={el.opacity || 0.8}
              />
            );
          }
          if ((el.type === "line" || el.type === "arrow") && el.width !== undefined) {
            return (
              <line
                key={el.id || i}
                x1={el.x}
                y1={el.y}
                x2={el.x + el.width}
                y2={el.y + el.height}
                stroke={el.strokeColor || "#ec4899"}
                strokeWidth={Math.max(2, (vbW / 60) * 1.5)}
                opacity={el.opacity || 0.8}
              />
            );
          }
          if (el.type === "pencil" && el.points && el.points.length > 1) {
            const d = el.points.reduce(
              (acc, p, idx) => (idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
              ""
            );
            return (
              <path
                key={el.id || i}
                d={d}
                fill="none"
                stroke={el.strokeColor || "#6366f1"}
                strokeWidth={Math.max(2, (vbW / 60) * 1.5)}
                opacity={el.opacity || 0.8}
              />
            );
          }
          return null;
        })}
      </svg>
    </div>
  );
}

export function BoardsSidebar({ isOpen, onClose }: BoardsSidebarProps) {
  const {
    boards,
    activeBoardId,
    setActiveBoardId,
    createNewBoard,
    renameBoard,
    duplicateBoard,
    deleteBoard,
    confirmDialog,
    showToast,
  } = useBoard();

  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const filteredBoards = useMemo(() => {
    if (!searchQuery.trim()) return boards;
    const q = searchQuery.toLowerCase().trim();
    return boards.filter((b) => b.name.toLowerCase().includes(q));
  }, [boards, searchQuery]);

  const handleStartRename = (id: string, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
  };

  const handleSaveRename = (id: string) => {
    if (editingName.trim()) {
      renameBoard(id, editingName.trim());
      showToast("Nombre de la pizarra actualizado", "success");
    }
    setEditingId(null);
  };

  const handleDelete = (id: string, name: string) => {
    if (boards.length <= 1) {
      showToast("No puedes eliminar la única pizarra disponible", "warning");
      return;
    }

    confirmDialog({
      title: "Eliminar pizarra",
      message: `¿Estás seguro de que deseas eliminar la pizarra "${name}"? Todos sus trazos y elementos se perderán de manera irreversible.`,
      confirmLabel: "Eliminar pizarra",
      cancelLabel: "Cancelar",
      danger: true,
      onConfirm: () => {
        deleteBoard(id);
        showToast(`Pizarra "${name}" eliminada`, "info");
      },
    });
  };

  const handleDuplicate = (id: string) => {
    duplicateBoard(id);
    showToast("Pizarra duplicada con éxito", "success");
  };

  const handleCreateNew = () => {
    const newId = createNewBoard();
    showToast("Nueva pizarra creada", "success");
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/25 backdrop-blur-xs transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Slide-over Lateral Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-84 sm:w-96 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-r border-neutral-200/90 dark:border-neutral-800 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200/90 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <FolderKanban size={19} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-50">
                  Mis Pizarras
                </h2>
                <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                  {boards.length}
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Organiza y navega por tus tableros
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            title="Cerrar panel lateral"
            className="p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        {/* Action & Search */}
        <div className="p-4 space-y-3 border-b border-neutral-100 dark:border-neutral-800/80">
          <button
            onClick={handleCreateNew}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 active:scale-[0.99] transition-all"
          >
            <Plus size={16} />
            <span>Crear Nueva Pizarra</span>
          </button>

          {/* Search filter input */}
          {boards.length > 2 && (
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <input
                type="text"
                placeholder="Buscar pizarra..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-neutral-100/80 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 outline-none focus:border-indigo-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Board Cards List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredBoards.length === 0 ? (
            <div className="py-10 text-center text-xs text-neutral-400">
              No se encontraron pizarras con "{searchQuery}"
            </div>
          ) : (
            filteredBoards.map((board) => {
              const isActive = board.id === activeBoardId;
              const count = board.elements ? board.elements.filter((el) => !el.isDeleted).length : 0;
              const dateStr = new Date(board.updatedAt || board.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={board.id}
                  onClick={() => {
                    if (editingId !== board.id) {
                      setActiveBoardId(board.id);
                    }
                  }}
                  className={`group relative flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                    isActive
                      ? "bg-indigo-50/80 border-indigo-500/90 dark:bg-indigo-950/40 dark:border-indigo-500/70 shadow-sm ring-1 ring-indigo-500/20"
                      : "border-neutral-200/90 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
                  }`}
                >
                  {/* Thumbnail Preview */}
                  <BoardThumbnail elements={board.elements || []} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex-1 min-w-0">
                        {editingId === board.id ? (
                          <div
                            className="flex items-center gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveRename(board.id);
                                if (e.key === "Escape") setEditingId(null);
                              }}
                              autoFocus
                              className="w-full px-2 py-0.5 text-xs font-medium rounded-lg border border-indigo-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none shadow-sm"
                            />
                            <button
                              onClick={() => handleSaveRename(board.id)}
                              className="p-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shrink-0"
                            >
                              <Check size={13} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 truncate">
                              {board.name}
                            </span>
                            {isActive && (
                              <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider rounded-md bg-indigo-600 text-white shadow-2xs">
                                Activa
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                          <span className="flex items-center gap-1">
                            <Layers size={11} className="text-neutral-400" />
                            {count} {count === 1 ? "trazo" : "trazos"}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 truncate">
                            <Calendar size={11} className="text-neutral-400 shrink-0" />
                            {dateStr}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div
                        className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleStartRename(board.id, board.name)}
                          title="Renombrar pizarra"
                          className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-colors"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDuplicate(board.id)}
                          title="Duplicar pizarra"
                          className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-colors"
                        >
                          <Copy size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(board.id, board.name)}
                          title={
                            boards.length <= 1
                              ? "No se puede eliminar la única pizarra"
                              : "Eliminar pizarra"
                          }
                          disabled={boards.length <= 1}
                          className={`p-1.5 rounded-lg transition-colors ${
                            boards.length <= 1
                              ? "opacity-25 cursor-not-allowed text-neutral-400"
                              : "hover:bg-rose-50 text-rose-500 hover:text-rose-600 dark:hover:bg-rose-950/30"
                          }`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 border-t border-neutral-200/90 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/60 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
          <span>Almacenamiento local 100% privado</span>
          <span>Trazzo Whiteboard</span>
        </div>
      </aside>
    </>
  );
}
