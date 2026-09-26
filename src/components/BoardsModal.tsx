"use client";

import React, { useState } from "react";
import {
  X,
  Plus,
  Copy,
  Trash2,
  Edit2,
  Check,
  LayoutGrid,
  Calendar,
} from "lucide-react";
import { useBoard } from "../context/BoardContext";

interface BoardsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BoardsModal({ isOpen, onClose }: BoardsModalProps) {
  const {
    boards,
    activeBoardId,
    setActiveBoardId,
    createNewBoard,
    renameBoard,
    duplicateBoard,
    deleteBoard,
  } = useBoard();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  if (!isOpen) return null;

  const handleStartRename = (id: string, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
  };

  const handleSaveRename = (id: string) => {
    if (editingName.trim()) {
      renameBoard(id, editingName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl shadow-2xl border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <LayoutGrid size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold">Mis Pizarras</h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Administra tus tableros guardados en este navegador
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Board List */}
        <div className="p-6 max-h-[55vh] overflow-y-auto space-y-2.5">
          {boards.map((board) => {
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
                className={`group flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isActive
                    ? "bg-indigo-50/70 border-indigo-500/80 dark:bg-indigo-950/30 dark:border-indigo-500/60 shadow-sm"
                    : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
                }`}
              >
                <div className="flex-1 min-w-0 mr-3">
                  {editingId === board.id ? (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveRename(board.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        autoFocus
                        className="w-full px-2 py-1 text-sm rounded border border-indigo-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none"
                      />
                      <button
                        onClick={() => handleSaveRename(board.id)}
                        className="p-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                      >
                        <Check size={14} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm truncate">{board.name}</span>
                        {isActive && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                            Activa
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                        <span>{count} {count === 1 ? "elemento" : "elementos"}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar size={11} /> {dateStr}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div
                  className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => handleStartRename(board.id, board.name)}
                    title="Renombrar"
                    className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => duplicateBoard(board.id)}
                    title="Duplicar pizarra"
                    className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-colors"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={() => deleteBoard(board.id)}
                    title="Eliminar pizarra"
                    disabled={boards.length <= 1}
                    className={`p-1.5 rounded-lg transition-colors ${
                      boards.length <= 1
                        ? "opacity-30 cursor-not-allowed text-neutral-400"
                        : "hover:bg-red-100 text-red-500 hover:text-red-600 dark:hover:bg-red-950/40"
                    }`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
          <span className="text-xs text-neutral-500">
            Total: {boards.length} {boards.length === 1 ? "pizarra" : "pizarras"}
          </span>
          <button
            onClick={() => {
              createNewBoard();
              onClose();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/25 transition-all"
          >
            <Plus size={16} />
            Nueva Pizarra
          </button>
        </div>
      </div>
    </div>
  );
}
