"use client";

import React, { useState } from "react";
import {
  ArrowUpToLine,
  ArrowDownToLine,
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
  Link as LinkIcon,
  ExternalLink,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Type,
  Image as ImageIcon,
  Download,
  Maximize2,
  Check,
} from "lucide-react";
import { useBoard } from "../context/BoardContext";
import { FillStyle, StrokeStyle, TextAlign } from "../types/canvas";
import { FONT_HAND, FONT_SANS, FONT_CODE } from "../lib/storage";

// Trazzo-curated sketch palette
const LIGHT_STROKE_COLORS = [
  { color: "#1e1e1e", label: "Oscuro / Negro" },
  { color: "#e03131", label: "Rojo" },
  { color: "#2f9e44", label: "Verde" },
  { color: "#1971c2", label: "Azul" },
  { color: "#f08c00", label: "Amarillo / Ámbar" },
  { color: "#697077", label: "Gris oscuro" },
];

const FILL_COLORS = [
  { color: "transparent", label: "Transparente" },
  { color: "#ffc9c9", label: "Pastel Rojo" },
  { color: "#b2f2bb", label: "Pastel Verde" },
  { color: "#a5d8ff", label: "Pastel Azul" },
  { color: "#ffec99", label: "Pastel Amarillo" },
  { color: "#ced4da", label: "Pastel Gris" },
];

const STROKE_WIDTHS = [
  { id: 1.5, label: "Fino", thickness: 1.5 },
  { id: 2.5, label: "Medio", thickness: 3 },
  { id: 4.5, label: "Grueso", thickness: 5 },
];

const STROKE_STYLES: { id: StrokeStyle; label: string; dash: string }[] = [
  { id: "solid", label: "Sólido", dash: "none" },
  { id: "dashed", label: "Guiones", dash: "6,4" },
  { id: "dotted", label: "Puntos", dash: "2,3" },
];

const SLOPPINESS = [
  { id: 0, label: "Arquitecto", title: "Arquitecto (Limpio)" },
  { id: 1.2, label: "Artista", title: "Artista (Boceto a mano)" },
  { id: 2.4, label: "Cartoon", title: "Cartoon (Desenfadado)" },
];

const FONT_FAMILIES = [
  { id: FONT_HAND, label: "A mano", title: "Manuscrito (Caveat)", font: "Caveat, cursive" },
  { id: FONT_SANS, label: "Normal", title: "Normal Sans (Inter)", font: "'Inter', system-ui, sans-serif" },
  { id: FONT_CODE, label: "Código", title: "Monoespaciado (Code)", font: "'JetBrains Mono', monospace" },
];

function isFontFamilyMatch(current: string | undefined, target: string): boolean {
  if (!current) return target === FONT_HAND;
  if (current === target) return true;
  const normCurrent = current.replace(/['"]/g, "").toLowerCase();
  const normTarget = target.replace(/['"]/g, "").toLowerCase();
  if (normTarget.includes("caveat")) {
    return normCurrent.includes("caveat") || normCurrent.includes("cursive");
  }
  if (normTarget.includes("inter") || normTarget.includes("system-ui")) {
    return (
      normCurrent.includes("inter") ||
      normCurrent.includes("system-ui") ||
      normCurrent.includes("sans-serif") ||
      normCurrent.includes("segoe") ||
      normCurrent.includes("arial")
    );
  }
  if (normTarget.includes("jetbrains") || normTarget.includes("mono")) {
    return (
      normCurrent.includes("jetbrains") ||
      normCurrent.includes("mono") ||
      normCurrent.includes("courier") ||
      normCurrent.includes("monospace")
    );
  }
  return false;
}

const FONT_SIZES = [
  { label: "S", value: 16, title: "Pequeño (16px)" },
  { label: "M", value: 20, title: "Mediano (20px)" },
  { label: "L", value: 28, title: "Grande (28px)" },
  { label: "XL", value: 36, title: "Extra grande (36px)" },
];

const TEXT_ALIGNS: { id: TextAlign; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: "left", label: "Izquierda", icon: AlignLeft },
  { id: "center", label: "Centro", icon: AlignCenter },
  { id: "right", label: "Derecha", icon: AlignRight },
];

export function PropertiesPanel() {
  const {
    activeTool,
    toolProps,
    updateToolProp,
    selectedIds,
    elements,
    setElements,
    updateSelectedElements,
    bringToFront,
    sendToBack,
    moveForward,
    moveBackward,
    duplicateSelectedElements,
    deleteSelectedElements,
    showToast,
    editingText,
  } = useBoard();

  const [isLinkOpen, setIsLinkOpen] = useState(false);

  const selectedElements = elements.filter((el) => selectedIds.includes(el.id));
  const hasSelection = selectedElements.length > 0;
  const isEditingTextActive = Boolean(editingText);

  // Show panel if an element is selected, text is being edited, or a drawing tool is active (except hand/eraser/laser/lasso)
  const isToolRelevant =
    isEditingTextActive ||
    !["hand", "eraser", "laser", "lasso"].includes(activeTool);
  if (!hasSelection && !isToolRelevant) {
    return null;
  }

  const isImageOnly = hasSelection && selectedElements.every((el) => el.type === "image");
  const isTextElement =
    isEditingTextActive ||
    (hasSelection
      ? selectedElements.some((el) => el.type === "text")
      : activeTool === "text");

  // Derive current values from active text draft, primary selected element, or toolProps
  const primaryEl = selectedElements[0];
  const currentStrokeColor = editingText
    ? editingText.strokeColor
    : hasSelection && primaryEl
    ? primaryEl.strokeColor
    : toolProps.strokeColor;
  const currentFillColor = hasSelection && primaryEl ? primaryEl.fillColor : toolProps.fillColor;
  const currentFillStyle = hasSelection && primaryEl ? primaryEl.fillStyle : toolProps.fillStyle;
  const currentStrokeWidth = hasSelection && primaryEl ? primaryEl.strokeWidth : toolProps.strokeWidth;
  const currentStrokeStyle = hasSelection && primaryEl ? primaryEl.strokeStyle : toolProps.strokeStyle;
  const currentRoughness = hasSelection && primaryEl ? primaryEl.roughness : toolProps.roughness;
  const currentOpacity = hasSelection && primaryEl ? primaryEl.opacity : toolProps.opacity;

  const currentFontSize = editingText
    ? editingText.fontSize
    : hasSelection && primaryEl && primaryEl.type === "text"
    ? primaryEl.fontSize
    : toolProps.fontSize;
  const currentFontFamily = editingText
    ? editingText.fontFamily
    : hasSelection && primaryEl && primaryEl.type === "text"
    ? primaryEl.fontFamily
    : toolProps.fontFamily;
  const currentTextAlign = editingText
    ? editingText.textAlign || "left"
    : hasSelection && primaryEl && primaryEl.type === "text"
    ? primaryEl.textAlign || "left"
    : toolProps.textAlign || "left";

  const currentLink = hasSelection && primaryEl ? primaryEl.link || "" : "";

  return (
    <div
      onMouseDown={(e) => {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag !== "INPUT" && tag !== "TEXTAREA") {
          e.preventDefault();
        }
      }}
      className="absolute top-28 md:top-20 left-4 z-20 w-64 max-h-[calc(100vh-130px)] md:max-h-[calc(100vh-100px)] overflow-y-auto p-4 rounded-2xl shadow-2xl shadow-neutral-900/10 dark:shadow-black/50 backdrop-blur-xl transition-all duration-200 border bg-white/90 text-neutral-800 border-neutral-200/80 dark:bg-neutral-900/90 dark:text-neutral-100 dark:border-neutral-800 text-xs select-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-200/80 dark:border-neutral-800">
        <span className="font-semibold text-xs flex items-center gap-1.5 text-neutral-900 dark:text-neutral-50">
          {isImageOnly ? (
            <ImageIcon size={15} className="text-indigo-500" />
          ) : isTextElement ? (
            <Type size={15} className="text-indigo-500" />
          ) : (
            <Palette size={15} className="text-indigo-500" />
          )}
          <span>
            {isImageOnly
              ? "Imagen"
              : isTextElement
              ? "Texto"
              : hasSelection
              ? `Propiedades (${selectedIds.length})`
              : "Estilo de trazo"}
          </span>
        </span>

        {/* Quick Actions Header: Duplicate, Delete, Link */}
        {hasSelection && (
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setIsLinkOpen((prev) => !prev)}
              title={currentLink ? `Enlace: ${currentLink}` : "Agregar enlace"}
              className={`p-1.5 rounded-lg transition-colors ${
                currentLink || isLinkOpen
                  ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400"
                  : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
              }`}
            >
              <LinkIcon size={14} />
            </button>
            <button
              onClick={duplicateSelectedElements}
              title="Duplicar (Ctrl+D)"
              className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
            >
              <Copy size={14} />
            </button>
            <button
              onClick={deleteSelectedElements}
              title="Eliminar (Supr / Backspace)"
              className="p-1.5 rounded-lg hover:bg-rose-50 text-neutral-500 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:text-neutral-400 dark:hover:text-rose-400 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Link URL Input Popdown */}
      {hasSelection && isLinkOpen && (
        <div className="mt-2.5 p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/60 flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-100">
          <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            Enlace de hipervínculo
          </label>
          <div className="flex items-center gap-1">
            <input
              type="url"
              placeholder="https://ejemplo.com"
              value={currentLink}
              onChange={(e) => updateSelectedElements({ link: e.target.value })}
              className="flex-1 px-2 py-1 text-xs rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 outline-none focus:ring-1 focus:ring-indigo-500"
              autoFocus
            />
            {currentLink && (
              <a
                href={currentLink.startsWith("http") ? currentLink : `https://${currentLink}`}
                target="_blank"
                rel="noreferrer"
                title="Abrir enlace en pestaña nueva"
                className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 text-indigo-600 dark:text-indigo-400"
              >
                <ExternalLink size={13} />
              </a>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4 pt-3">
        {/* Stroke Color (Presets + Custom color picker) */}
        {!isImageOnly && (
          <div>
            <label className="block text-[11px] font-semibold tracking-wider uppercase text-neutral-400 mb-2">
              Color de trazo
            </label>
            <div className="grid grid-cols-7 gap-1.5 items-center">
              {LIGHT_STROKE_COLORS.map(({ color, label }) => {
                const isSelected = currentStrokeColor.toLowerCase() === color.toLowerCase();
                const isLightSwatch = ["#ffffff", "#f8f9fa", "#ced4da", "#ffd43b"].includes(color.toLowerCase());
                return (
                  <button
                    key={color}
                    onClick={() => updateToolProp("strokeColor", color)}
                    title={label}
                    className={`w-7 h-7 rounded-xl border flex items-center justify-center transition-all hover:scale-105 active:scale-95 relative ${
                      isSelected
                        ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-white border-transparent shadow-xs"
                        : "border-neutral-200 hover:border-neutral-300"
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {isSelected && (
                      <Check
                        size={12}
                        className={isLightSwatch ? "text-neutral-900" : "text-white"}
                      />
                    )}
                  </button>
                );
              })}

              {/* Custom Stroke Color Picker */}
              <label
                title="Color de trazo personalizado"
                className={`w-7 h-7 rounded-xl border flex items-center justify-center transition-all hover:scale-105 active:scale-95 relative cursor-pointer overflow-hidden ${
                  !LIGHT_STROKE_COLORS.some((c) => c.color.toLowerCase() === currentStrokeColor.toLowerCase())
                    ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-white border-transparent shadow-xs"
                    : "border-dashed border-neutral-300 hover:border-indigo-400"
                }`}
                style={{
                  backgroundColor: !LIGHT_STROKE_COLORS.some((c) => c.color.toLowerCase() === currentStrokeColor.toLowerCase())
                    ? currentStrokeColor
                    : undefined,
                }}
              >
                <input
                  type="color"
                  value={currentStrokeColor.startsWith("#") ? currentStrokeColor : "#1e1e1e"}
                  onChange={(e) => updateToolProp("strokeColor", e.target.value)}
                  className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                />
                {!LIGHT_STROKE_COLORS.some((c) => c.color.toLowerCase() === currentStrokeColor.toLowerCase()) ? (
                  <Check size={12} className="text-white drop-shadow-sm pointer-events-none" />
                ) : (
                  <div
                    className="w-3.5 h-3.5 rounded-full pointer-events-none"
                    style={{
                      background: "conic-gradient(from 0deg, #f43f5e, #fbbf24, #10b981, #06b6d4, #6366f1, #d946ef, #f43f5e)",
                    }}
                  />
                )}
              </label>
            </div>
          </div>
        )}

        {/* Text Properties (Font family, Font size, Text alignment) */}
        {isTextElement && (
          <div className="space-y-3.5 pt-2 border-t border-neutral-200/70 dark:border-neutral-800/70">
            {/* Font Family (Hand, Sans, Code) */}
            <div>
              <label className="block text-[11px] font-semibold tracking-wider uppercase text-neutral-400 dark:text-neutral-500 mb-2">
                Tipografía
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {FONT_FAMILIES.map((f) => {
                  const isSelected = isFontFamilyMatch(currentFontFamily, f.id);
                  return (
                    <button
                      key={f.label}
                      onClick={() => updateToolProp("fontFamily", f.id)}
                      title={f.title}
                      className={`py-1.5 px-2 rounded-xl text-xs transition-all border ${
                        isSelected
                          ? "bg-indigo-50 text-indigo-600 border-indigo-400/80 dark:bg-indigo-950/60 dark:border-indigo-500/50 dark:text-indigo-400 font-semibold shadow-xs"
                          : "border-neutral-200/80 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                      }`}
                      style={{ fontFamily: f.font }}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Font Size (S: 16px, M: 20px, L: 28px, XL: 36px) */}
            <div>
              <label className="block text-[11px] font-semibold tracking-wider uppercase text-neutral-400 dark:text-neutral-500 mb-2">
                Tamaño de texto
              </label>
              <div className="grid grid-cols-4 gap-1 p-0.5 rounded-xl bg-neutral-100/80 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60">
                {FONT_SIZES.map((size) => {
                  const isSelected = currentFontSize === size.value;
                  return (
                    <button
                      key={size.label}
                      onClick={() => updateToolProp("fontSize", size.value)}
                      title={size.title}
                      className={`py-1 rounded-lg text-xs font-semibold transition-all ${
                        isSelected
                          ? "bg-white dark:bg-neutral-700 text-indigo-600 dark:text-indigo-400 shadow-xs"
                          : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                      }`}
                    >
                      {size.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Text Alignment (Left, Center, Right) */}
            <div>
              <label className="block text-[11px] font-semibold tracking-wider uppercase text-neutral-400 dark:text-neutral-500 mb-2">
                Alineación
              </label>
              <div className="grid grid-cols-3 gap-1 p-0.5 rounded-xl bg-neutral-100/80 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60">
                {TEXT_ALIGNS.map(({ id, label, icon: Icon }) => {
                  const isSelected = currentTextAlign === id;
                  return (
                    <button
                      key={id}
                      onClick={() => updateToolProp("textAlign", id)}
                      title={label}
                      className={`py-1.5 flex items-center justify-center rounded-lg transition-all ${
                        isSelected
                          ? "bg-white dark:bg-neutral-700 text-indigo-600 dark:text-indigo-400 shadow-xs"
                          : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                      }`}
                    >
                      <Icon size={14} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Background Color (Presets + Custom color picker) */}
        {!isImageOnly && !isTextElement && (
          <div>
            <label className="block text-[11px] font-semibold tracking-wider uppercase text-neutral-400 dark:text-neutral-500 mb-2">
              Color de fondo
            </label>
            <div className="grid grid-cols-7 gap-1.5 items-center">
              {FILL_COLORS.map(({ color, label }) => {
                const isSelected = currentFillColor.toLowerCase() === color.toLowerCase();
                return (
                  <button
                    key={color}
                    onClick={() => updateToolProp("fillColor", color)}
                    title={label}
                    className={`w-7 h-7 rounded-xl border flex items-center justify-center transition-all hover:scale-105 active:scale-95 relative ${
                      isSelected
                        ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-offset-neutral-900 border-transparent shadow-xs"
                        : "border-neutral-200/90 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600"
                    }`}
                    style={{
                      backgroundColor: color === "transparent" ? undefined : color,
                      backgroundImage:
                        color === "transparent"
                          ? "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)"
                          : undefined,
                      backgroundSize: "6px 6px",
                    }}
                  >
                    {isSelected && (
                      <Check
                        size={12}
                        className={color === "transparent" ? "text-neutral-800" : "text-neutral-700"}
                      />
                    )}
                  </button>
                );
              })}

              {/* Custom Fill Color Picker */}
              <label
                title="Color de fondo personalizado"
                className={`w-7 h-7 rounded-xl border flex items-center justify-center transition-all hover:scale-105 active:scale-95 relative cursor-pointer overflow-hidden ${
                  currentFillColor !== "transparent" && !FILL_COLORS.some((c) => c.color.toLowerCase() === currentFillColor.toLowerCase())
                    ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-offset-neutral-900 border-transparent shadow-xs"
                    : "border-dashed border-neutral-300 dark:border-neutral-700 hover:border-indigo-400"
                }`}
                style={{
                  backgroundColor:
                    currentFillColor !== "transparent" && !FILL_COLORS.some((c) => c.color.toLowerCase() === currentFillColor.toLowerCase())
                      ? currentFillColor
                      : undefined,
                }}
              >
                <input
                  type="color"
                  value={currentFillColor.startsWith("#") ? currentFillColor : "#e0e7ff"}
                  onChange={(e) => updateToolProp("fillColor", e.target.value)}
                  className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                />
                {currentFillColor !== "transparent" && !FILL_COLORS.some((c) => c.color.toLowerCase() === currentFillColor.toLowerCase()) ? (
                  <Check size={12} className="text-neutral-800 drop-shadow-sm pointer-events-none" />
                ) : (
                  <div
                    className="w-3.5 h-3.5 rounded-full pointer-events-none"
                    style={{
                      background: "conic-gradient(from 0deg, #f43f5e, #fbbf24, #10b981, #06b6d4, #6366f1, #d946ef, #f43f5e)",
                    }}
                  />
                )}
              </label>
            </div>
          </div>
        )}

        {/* Fill Style (if background is not transparent) */}
        {!isTextElement && !isImageOnly && currentFillColor !== "transparent" && (
          <div>
            <label className="block text-[11px] font-semibold tracking-wider uppercase text-neutral-400 dark:text-neutral-500 mb-2">
              Estilo de relleno
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(["hachure", "solid", "cross-hatch"] as FillStyle[]).map((style) => (
                <button
                  key={style}
                  onClick={() => updateToolProp("fillStyle", style)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-medium border capitalize transition-all ${
                    currentFillStyle === style
                      ? "bg-indigo-50 text-indigo-600 border-indigo-400/80 dark:bg-indigo-950/60 dark:border-indigo-500/50 dark:text-indigo-400 font-semibold shadow-xs"
                      : "border-neutral-200/80 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                  }`}
                >
                  {style === "hachure" ? "Rayado" : style === "solid" ? "Sólido" : "Cruzado"}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stroke Width (3 buttons: thin, medium, bold) */}
        {!isImageOnly && !isTextElement && (
          <div>
            <label className="block text-[11px] font-semibold tracking-wider uppercase text-neutral-400 dark:text-neutral-500 mb-2">
              Grosor del trazo
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {STROKE_WIDTHS.map(({ id, label, thickness }) => {
                const isSelected = Math.abs(currentStrokeWidth - id) < 0.6;
                return (
                  <button
                    key={id}
                    onClick={() => updateToolProp("strokeWidth", id)}
                    title={label}
                    className={`py-2 rounded-xl flex items-center justify-center border transition-all ${
                      isSelected
                        ? "bg-indigo-50 border-indigo-400/80 text-indigo-600 dark:bg-indigo-950/60 dark:border-indigo-500/50 dark:text-indigo-400 shadow-xs"
                        : "border-neutral-200/80 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                    }`}
                  >
                    <div
                      className="bg-current rounded-full"
                      style={{ width: "22px", height: `${thickness}px` }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Stroke Style (3 buttons: solid, dashed, dotted) */}
        {!isImageOnly && !isTextElement && (
          <div>
            <label className="block text-[11px] font-semibold tracking-wider uppercase text-neutral-400 dark:text-neutral-500 mb-2">
              Estilo de línea
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {STROKE_STYLES.map(({ id, label, dash }) => {
                const isSelected = currentStrokeStyle === id;
                return (
                  <button
                    key={id}
                    onClick={() => updateToolProp("strokeStyle", id)}
                    title={label}
                    className={`py-2 px-1 rounded-xl flex items-center justify-center border transition-all ${
                      isSelected
                        ? "bg-indigo-50 text-indigo-600 border-indigo-400/80 dark:bg-indigo-950/60 dark:border-indigo-500/50 dark:text-indigo-400 shadow-xs"
                        : "border-neutral-200/80 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                    }`}
                  >
                    <svg width="24" height="6" className="overflow-visible">
                      <line
                        x1="0"
                        y1="3"
                        x2="24"
                        y2="3"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray={dash}
                      />
                    </svg>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Sloppiness (3 buttons: Architect, Artist, Cartoon) */}
        {!isImageOnly && !isTextElement && (
          <div>
            <label className="block text-[11px] font-semibold tracking-wider uppercase text-neutral-400 dark:text-neutral-500 mb-2">
              Trazado a mano
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {SLOPPINESS.map((item) => {
                const isSelected = Math.abs(currentRoughness - item.id) < 0.5;
                return (
                  <button
                    key={item.label}
                    onClick={() => updateToolProp("roughness", item.id)}
                    title={item.title}
                    className={`py-1.5 px-2 rounded-xl text-xs font-medium border transition-all ${
                      isSelected
                        ? "bg-indigo-50 text-indigo-600 border-indigo-400/80 dark:bg-indigo-950/60 dark:border-indigo-500/50 dark:text-indigo-400 font-semibold shadow-xs"
                        : "border-neutral-200/80 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Opacity Slider (0% to 100%) */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-[11px] font-semibold tracking-wider uppercase text-neutral-400 dark:text-neutral-500">
              Opacidad
            </label>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-700/60">
              {Math.round(currentOpacity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={currentOpacity}
            onChange={(e) => updateToolProp("opacity", parseFloat(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer"
          />
        </div>

        {/* Layers (4 buttons: Send to back, Send backward, Bring forward, Bring to front) */}
        {hasSelection && (
          <div className="pt-2 border-t border-neutral-200/80 dark:border-neutral-800">
            <label className="block text-[11px] font-semibold tracking-wider uppercase text-neutral-400 dark:text-neutral-500 mb-2">
              Capas y Orden
            </label>
            <div className="grid grid-cols-4 gap-1 p-0.5 rounded-xl bg-neutral-100/80 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60">
              <button
                onClick={sendToBack}
                title="Enviar al fondo (Ctrl+[)"
                className="py-1.5 flex items-center justify-center rounded-lg transition-all text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white dark:hover:bg-neutral-700"
              >
                <ArrowDownToLine size={14} />
              </button>
              <button
                onClick={moveBackward}
                title="Bajar una capa ([)"
                className="py-1.5 flex items-center justify-center rounded-lg transition-all text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white dark:hover:bg-neutral-700"
              >
                <ArrowDown size={14} />
              </button>
              <button
                onClick={moveForward}
                title="Subir una capa (])"
                className="py-1.5 flex items-center justify-center rounded-lg transition-all text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white dark:hover:bg-neutral-700"
              >
                <ArrowUp size={14} />
              </button>
              <button
                onClick={bringToFront}
                title="Traer al frente (Ctrl+])"
                className="py-1.5 flex items-center justify-center rounded-lg transition-all text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white dark:hover:bg-neutral-700"
              >
                <ArrowUpToLine size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Image Actions */}
        {isImageOnly && (
          <div className="pt-2 border-t border-neutral-200/80 dark:border-neutral-800">
            <label className="block text-[11px] font-semibold tracking-wider uppercase text-neutral-400 dark:text-neutral-500 mb-2">
              Opciones de Imagen
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => {
                  const imgEl = selectedElements[0] as any;
                  if (!imgEl.aspectRatio) return;
                  const newHeight = Math.round(Math.abs(imgEl.width) / imgEl.aspectRatio);
                  setElements((prev) =>
                    prev.map((el) => (el.id === imgEl.id ? { ...el, height: newHeight } : el))
                  );
                  showToast("Proporción original restaurada", "success");
                }}
                title="Ajustar altura para coincidir con la proporción original"
                className="py-1.5 px-2 rounded-xl border border-neutral-200/80 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center gap-1.5 transition-all text-neutral-700 dark:text-neutral-300 text-[11px]"
              >
                <Maximize2 size={13} className="text-indigo-500" />
                Proporción
              </button>
              <button
                onClick={() => {
                  const imgEl = selectedElements[0] as any;
                  if (!imgEl.src) return;
                  const a = document.createElement("a");
                  a.href = imgEl.src;
                  a.download = `trazzo-imagen-${Date.now()}.png`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  showToast("Imagen descargada", "success");
                }}
                title="Descargar esta imagen en tu dispositivo"
                className="py-1.5 px-2 rounded-xl border border-neutral-200/80 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center gap-1.5 transition-all text-neutral-700 dark:text-neutral-300 text-[11px]"
              >
                <Download size={13} className="text-indigo-500" />
                Descargar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
