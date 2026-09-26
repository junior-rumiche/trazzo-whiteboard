"use client";

import React, { useState } from "react";
import {
  X,
  Image as ImageIcon,
  FileCode2,
  Download,
  Upload,
  Check,
  Sparkles,
} from "lucide-react";
import { useBoard } from "../context/BoardContext";
import { exportBoardToPng, exportBoardToTrazzoFile, parseTrazzoFile } from "../lib/export";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const { activeBoard, boards, elements, importBoardsOrElements, theme, showToast } = useBoard();

  const [activeTab, setActiveTab] = useState<"png" | "trazzo">("png");
  const [withBackground, setWithBackground] = useState(true);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [scale, setScale] = useState(2);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExportPng = async () => {
    setIsExporting(true);
    try {
      await exportBoardToPng(elements, activeBoard.name, {
        withBackground,
        backgroundColor: bgColor,
        scale,
        isDark: false,
      });
      showToast("Imagen PNG descargada con éxito", "success");
      onClose();
    } catch (e: any) {
      showToast(e.message || "Error al exportar PNG", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportTrazzo = (exportAll: boolean) => {
    try {
      exportBoardToTrazzoFile(activeBoard, exportAll ? boards : undefined);
      showToast("Archivo .trazzo exportado con éxito", "success");
      onClose();
    } catch (e: any) {
      showToast(e.message || "Error al exportar", "error");
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseTrazzoFile(text);
        importBoardsOrElements(parsed);
        onClose();
      } catch (err: any) {
        showToast(err.message || "Error al leer el archivo .trazzo", "error");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl shadow-2xl border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold">Exportar e Importar</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 p-1">
          <button
            onClick={() => setActiveTab("png")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "png"
                ? "bg-white dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
            }`}
          >
            <ImageIcon size={15} />
            Imagen PNG
          </button>
          <button
            onClick={() => setActiveTab("trazzo")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "trazzo"
                ? "bg-white dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
            }`}
          >
            <FileCode2 size={15} />
            Archivo .trazzo
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-4">
          {activeTab === "png" ? (
            <>
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-2">
                  Fondo de la imagen
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setWithBackground(true);
                      setBgColor("#ffffff");
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                      withBackground && bgColor === "#ffffff"
                        ? "border-indigo-500 bg-indigo-50 text-indigo-600 shadow-xs"
                        : "border-neutral-200 hover:border-neutral-300 text-neutral-700"
                    }`}
                  >
                    <div className="w-3.5 h-3.5 rounded-full border border-neutral-300 bg-white shadow-xs" />
                    Blanco
                  </button>
                  <button
                    onClick={() => setWithBackground(false)}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                      !withBackground
                        ? "border-indigo-500 bg-indigo-50 text-indigo-600 shadow-xs"
                        : "border-neutral-200 hover:border-neutral-300 text-neutral-700"
                    }`}
                  >
                    Transparente
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-2">
                  Resolución
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setScale(1)}
                    className={`py-2 rounded-xl border text-xs font-medium ${
                      scale === 1
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
                        : "border-neutral-200 dark:border-neutral-800"
                    }`}
                  >
                    1x (Estándar)
                  </button>
                  <button
                    onClick={() => setScale(2)}
                    className={`py-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 ${
                      scale === 2
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
                        : "border-neutral-200 dark:border-neutral-800"
                    }`}
                  >
                    <Sparkles size={13} />
                    2x (Alta Definición)
                  </button>
                </div>
              </div>

              <button
                onClick={handleExportPng}
                disabled={isExporting || elements.filter((el) => !el.isDeleted).length === 0}
                className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download size={16} />
                {isExporting ? "Generando PNG..." : "Descargar Imagen PNG"}
              </button>
            </>
          ) : (
            <>
              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700/50 text-xs space-y-1.5">
                <div className="font-semibold text-neutral-800 dark:text-neutral-200">
                  Formato de archivo nativo .trazzo
                </div>
                <p className="text-neutral-500 dark:text-neutral-400">
                  Guarda todas las figuras vectoriales, trazos y pizarras en un archivo portable para editarlas cuando quieras o compartirlas.
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  onClick={() => handleExportTrazzo(false)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/25 transition-all"
                >
                  <Download size={16} />
                  Descargar Pizarra Actual (.trazzo)
                </button>
                <button
                  onClick={() => handleExportTrazzo(true)}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 transition-all"
                >
                  Descargar Todas las Pizarras ({boards.length}) (.trazzo)
                </button>
              </div>

              <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-2">
                  Importar archivo existente
                </label>
                <label className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 cursor-pointer transition-all text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  <Upload size={16} className="text-indigo-500" />
                  Seleccionar archivo .trazzo
                  <input
                    type="file"
                    accept=".trazzo,application/json"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </label>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
