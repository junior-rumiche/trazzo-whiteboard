import rough from "roughjs";
import { Board, TrazzoElement, TrazzoFileFormat } from "../types/canvas";
import { getCombinedBounds } from "./geometry";
import { renderElement, preloadImage, isColorDark } from "./renderer";

export interface ExportPngOptions {
  scale?: number;
  backgroundColor?: string;
  withBackground?: boolean;
  padding?: number;
  isDark?: boolean;
}

export function exportBoardToPng(
  elements: TrazzoElement[],
  boardName: string,
  options: ExportPngOptions = {}
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const activeElements = elements.filter((el) => !el.isDeleted);
      if (activeElements.length === 0) {
        throw new Error("No hay elementos para exportar en esta pizarra.");
      }

      // Preload images if any
      const imageElements = activeElements.filter((el) => el.type === "image");
      if (imageElements.length > 0) {
        await Promise.all(
          imageElements.map((el) => preloadImage((el as any).src))
        );
      }

      // Ensure custom fonts are loaded before drawing text
      if (typeof document !== "undefined" && document.fonts) {
        await Promise.allSettled([
          document.fonts.load("20px Caveat"),
          document.fonts.load("20px Inter"),
          document.fonts.load("20px 'JetBrains Mono'"),
          document.fonts.ready,
        ]);
      }

      const bounds = getCombinedBounds(activeElements);
      if (!bounds) {
        throw new Error("No se pudieron calcular los límites de la pizarra.");
      }

      const padding = options.padding ?? 40;
      const scale = options.scale ?? 2; // high-res
      const width = Math.max(100, Math.ceil(bounds.width + padding * 2));
      const height = Math.max(100, Math.ceil(bounds.height + padding * 2));

      const canvas = document.createElement("canvas");
      canvas.width = width * scale;
      canvas.height = height * scale;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("No se pudo obtener el contexto 2D para exportar");
      }

      ctx.scale(scale, scale);

      // Background
      if (options.withBackground !== false) {
        ctx.fillStyle = options.backgroundColor || "#ffffff";
        ctx.fillRect(0, 0, width, height);
      } else {
        ctx.clearRect(0, 0, width, height);
      }

      // Translate so elements align with padding
      ctx.translate(padding - bounds.minX, padding - bounds.minY);

      const rc = rough.canvas(canvas);

      const isDarkExport =
        options.isDark !== undefined
          ? options.isDark
          : options.withBackground !== false
          ? isColorDark(options.backgroundColor || "#ffffff")
          : false;

      // Render elements
      for (const el of activeElements) {
        renderElement(ctx, rc, el, isDarkExport);
      }

      const triggerDownload = (url: string) => {
        const a = document.createElement("a");
        const cleanName = (boardName || "pizarra").trim().replace(/[^a-zA-Z0-9_\-\s]/g, "");
        a.download = `${cleanName || "trazzo"}.png`;
        a.href = url;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        resolve();
      };

      // Convert to blob or dataURL
      if (canvas.toBlob) {
        canvas.toBlob((blob) => {
          if (!blob) {
            // Fallback to dataURL
            const dataUrl = canvas.toDataURL("image/png");
            triggerDownload(dataUrl);
            return;
          }
          const url = URL.createObjectURL(blob);
          triggerDownload(url);
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        }, "image/png");
      } else {
        const dataUrl = canvas.toDataURL("image/png");
        triggerDownload(dataUrl);
      }
    } catch (err) {
      console.error("Error al exportar PNG:", err);
      reject(err);
    }
  });
}

export function exportBoardToTrazzoFile(
  board: Board,
  allBoards?: Board[]
): void {
  const fileData: TrazzoFileFormat = {
    type: "trazzo/file",
    version: 1,
    app: "Trazzo",
    createdAt: Date.now(),
    board: board,
    boards: allBoards,
    elements: board.elements.filter((el) => !el.isDeleted),
  };

  const jsonStr = JSON.stringify(fileData, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const cleanName = (board.name || "pizarra").trim().replace(/[^a-zA-Z0-9_\-\s]/g, "");
  a.download = `${cleanName || "dibujo"}.trazzo`;
  a.href = url;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseTrazzoFile(content: string): {
  board?: Board;
  boards?: Board[];
  elements?: TrazzoElement[];
} {
  const parsed = JSON.parse(content);

  // Validate format
  if (parsed.type === "trazzo/file" || parsed.app === "Trazzo") {
    return {
      board: parsed.board,
      boards: parsed.boards,
      elements: parsed.elements,
    };
  }

  // Fallback if raw board JSON or array of elements
  if (parsed.elements && Array.isArray(parsed.elements)) {
    return {
      elements: parsed.elements,
      board: parsed,
    };
  }

  if (Array.isArray(parsed)) {
    return {
      elements: parsed,
    };
  }

  throw new Error("El archivo no tiene un formato válido de Trazzo (.trazzo)");
}
