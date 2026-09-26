"use client";

import dynamic from "next/dynamic";
import { BoardProvider } from "../context/BoardContext";
import { Header } from "../components/Header";
import { Toolbar } from "../components/Toolbar";
import { PropertiesPanel } from "../components/PropertiesPanel";
import { ZoomControls } from "../components/ZoomControls";

const Canvas = dynamic(() => import("../components/Canvas").then((mod) => mod.Canvas), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-neutral-50 text-neutral-600">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Cargando lienzo de Trazzo...</span>
      </div>
    </div>
  ),
});

function AppContent() {
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-neutral-50 text-neutral-900">
      {/* Semantic Accessible SEO Section for Search Engine Indexing and Screen Readers */}
      <section aria-label="Información y características de Trazzo" className="sr-only">
        <h1>Trazzo — Pizarra Virtual Gratuita, Diagramación y Dibujo en Línea</h1>
        <p>
          Trazzo es una herramienta web de pizarra virtual y diagramas interactivos diseñada para
          crear bocetos a mano alzada, diagramas de arquitectura de software, diagramas de flujo,
          wireframes y mapas conceptuales con total privacidad en tu navegador.
        </p>

        <h2>Principales Características de Trazzo</h2>
        <ul>
          <li>Lienzo infinito con zoom y desplazamiento suave.</li>
          <li>Figuras geométricas: rectángulos, rombos, círculos, elipses, flechas y líneas rectas.</li>
          <li>Conectores magnéticos inteligentes que se adhieren y siguen el movimiento de las figuras.</li>
          <li>Dibujo libre con trazos fluidos estilo boceto orgánico.</li>
          <li>Reconocimiento inteligente de figuras dibujadas a mano.</li>
          <li>Puntero láser dinámico con estela para presentaciones y exposiciones.</li>
          <li>Marcos (frames) para estructurar vistas de pantalla y diagramas modulares.</li>
          <li>Inserción de texto multilínea, imágenes y selección por lazo.</li>
          <li>Exportación a PNG de alta resolución, gráficos vectoriales SVG y archivos .trazzo.</li>
          <li>100% privado y seguro: todos tus proyectos se guardan localmente en tu navegador.</li>
        </ul>

        <h2>Pizarra Virtual sin Registro y de Código Libre</h2>
        <p>
          Sin necesidad de crear cuentas ni compartir datos personales. Trazzo arranca al instante y
          mantiene tus ideas protegidas en tu equipo.
        </p>
      </section>

      <noscript>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-white text-neutral-900 text-center">
          <div className="max-w-md">
            <h2 className="text-xl font-bold mb-2">JavaScript es necesario para usar Trazzo</h2>
            <p className="text-sm text-neutral-600 mb-4">
              Trazzo es una pizarra virtual interactiva de alto rendimiento en el navegador. Por
              favor, activa JavaScript en la configuración de tu navegador para acceder al lienzo de
              dibujo y diagramación.
            </p>
          </div>
        </div>
      </noscript>

      <Header />
      <Toolbar />
      <PropertiesPanel />
      <div className="w-full h-full">
        <Canvas />
      </div>
      <ZoomControls />
      {/* Semantic Accessible Footer with Quick Information */}
      <footer className="absolute bottom-4 left-4 z-10 hidden md:flex items-center gap-2 px-3 py-1.5 rounded-2xl shadow-xl shadow-neutral-900/5 dark:shadow-black/40 backdrop-blur-xl border border-neutral-200/80 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90 text-[11px] text-neutral-600 dark:text-neutral-400 select-none pointer-events-auto">
        <span className="font-semibold text-neutral-800 dark:text-neutral-200">Trazzo</span>
        <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
        <span>Pizarra Virtual y Diagramas en Línea</span>
        <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
        <span className="text-emerald-600 dark:text-emerald-400 font-medium">100% Privado y Sin Registro</span>
      </footer>
    </main>
  );
}

export default function Home() {
  return (
    <BoardProvider>
      <AppContent />
    </BoardProvider>
  );
}
