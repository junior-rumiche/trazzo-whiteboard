"use client";

import React, { useState } from "react";
import { X, Keyboard, Info, ShieldCheck, Sparkles } from "lucide-react";

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUT_GROUPS = [
  {
    title: "Herramientas",
    shortcuts: [
      { key: "V ó 1", desc: "Herramienta Selección" },
      { key: "H ó 2", desc: "Mano para desplazar" },
      { key: "R ó 3", desc: "Rectángulo" },
      { key: "D ó 4", desc: "Rombo" },
      { key: "O ó 5", desc: "Círculo / Elipse" },
      { key: "A ó 6", desc: "Flecha" },
      { key: "L ó 7", desc: "Línea recta" },
      { key: "P ó 8", desc: "Lápiz a mano alzada" },
      { key: "T", desc: "Texto libre" },
      { key: "E ó 0", desc: "Borrador de elementos" },
      { key: "9 ó I", desc: "Insertar imagen" },
      { key: "F", desc: "Herramienta de marco" },
      { key: "Shift + X", desc: "Dibujar a forma inteligente" },
      { key: "K", desc: "Puntero láser" },
      { key: "B", desc: "Bote de pintura" },
    ],
  },
  {
    title: "Acciones y Navegación",
    shortcuts: [
      { key: "Ctrl + Z", desc: "Deshacer acción" },
      { key: "Ctrl + Y", desc: "Rehacer acción" },
      { key: "Ctrl + C", desc: "Copiar selección" },
      { key: "Ctrl + V", desc: "Pegar elementos" },
      { key: "Ctrl + X", desc: "Cortar elementos" },
      { key: "Supr / Borrar", desc: "Eliminar elemento(s)" },
      { key: "Ctrl + D", desc: "Duplicar selección" },
      { key: "Ctrl + A", desc: "Seleccionar todo" },
      { key: "Espacio + Arrastre", desc: "Desplazar lienzo libremente" },
      { key: "Ctrl + Rueda", desc: "Acercar / Alejar zoom" },
      { key: "Arrastrar archivo", desc: "Importar archivo .trazzo" },
      { key: "Escape", desc: "Cancelar / Deseleccionar" },
    ],
  },
];

const FAQS = [
  {
    q: "¿Qué es Trazzo?",
    a: "Trazzo es una pizarra virtual interactiva y herramienta de diagramación en tu navegador para crear diagramas de flujo, arquitectura, wireframes y bocetos a mano alzada.",
  },
  {
    q: "¿Es gratuito y requiere registro?",
    a: "Es 100% gratuito, libre y sin registro. No necesitas crear cuenta para utilizar todas las herramientas.",
  },
  {
    q: "¿Dónde se guardan mis datos?",
    a: "Todos tus diagramas se guardan exclusivamente en el almacenamiento local de tu navegador (LocalStorage e IndexedDB). Tus datos nunca se envían a servidores externos.",
  },
  {
    q: "¿Qué formatos puedo exportar?",
    a: "Puedes exportar en formato de imagen PNG de alta resolución (fondo transparente u opaco), vectores SVG escalables o archivo de proyecto nativo .trazzo.",
  },
];

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  const [activeTab, setActiveTab] = useState<"shortcuts" | "about">("shortcuts");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl shadow-2xl border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              {activeTab === "shortcuts" ? <Keyboard size={20} /> : <Info size={20} />}
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {activeTab === "shortcuts" ? "Atajos de Teclado" : "Acerca de Trazzo"}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {activeTab === "shortcuts"
                  ? "Acelera tu flujo de trabajo en Trazzo"
                  : "Pizarra virtual interactiva y privada"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 px-6 pt-2 gap-4">
          <button
            onClick={() => setActiveTab("shortcuts")}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "shortcuts"
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
            }`}
          >
            <Keyboard size={14} />
            <span>Atajos</span>
          </button>
          <button
            onClick={() => setActiveTab("about")}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "about"
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
            }`}
          >
            <Info size={14} />
            <span>Acerca de Trazzo</span>
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
          {activeTab === "shortcuts" ? (
            SHORTCUT_GROUPS.map((group) => (
              <div key={group.title}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-3">
                  {group.title}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {group.shortcuts.map((sc) => (
                    <div
                      key={sc.key}
                      className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-800/60"
                    >
                      <span className="text-xs text-neutral-600 dark:text-neutral-300 font-medium">
                        {sc.desc}
                      </span>
                      <kbd className="px-2 py-0.5 text-[11px] font-mono font-semibold rounded-md bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 shadow-sm text-neutral-800 dark:text-neutral-200">
                        {sc.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="space-y-5 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/50">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-semibold mb-1">
                  <Sparkles size={15} />
                  <span>Pizarra Virtual para tus ideas</span>
                </div>
                <p>
                  Trazzo te permite crear diagramas de flujo, diagramas de arquitectura, wireframes y bocetos con la naturalidad del dibujo a mano alzada y la precisión de formas inteligentes.
                </p>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40">
                <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-0.5">Privacidad 100% Garantizada</h4>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    Tus proyectos se almacenan exclusivamente en tu navegador. Sin rastreadores de terceros, sin cuentas obligatorias y sin servidores intermediarios.
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider text-[11px] mb-2.5">
                  Preguntas Frecuentes
                </h4>
                <div className="space-y-3">
                  {FAQS.map((faq) => (
                    <div key={faq.q} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-800/60">
                      <div className="font-semibold text-neutral-800 dark:text-neutral-200 mb-1">{faq.q}</div>
                      <div className="text-neutral-500 dark:text-neutral-400 text-[11px]">{faq.a}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
