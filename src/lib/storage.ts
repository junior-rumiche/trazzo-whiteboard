import type { Board, TrazzoElement, ToolProperties } from "../types/canvas.ts";

const STORAGE_KEY_BOARDS = "trazzo_boards_v1";
const STORAGE_KEY_ACTIVE = "trazzo_active_board_id_v1";
const STORAGE_KEY_PROPS = "trazzo_tool_properties_v1";
const STORAGE_KEY_THEME = "trazzo_theme_v1";

export const FONT_HAND = "Caveat, cursive, sans-serif";
export const FONT_SANS = "'Inter', system-ui, sans-serif";
export const FONT_CODE = "'JetBrains Mono', 'Courier New', monospace";

export const DEFAULT_TOOL_PROPERTIES: ToolProperties = {
  strokeColor: "#1e1e1e",
  fillColor: "#e0e7ff",
  fillStyle: "hachure",
  strokeWidth: 2,
  strokeStyle: "solid",
  roughness: 1,
  opacity: 1,
  fontSize: 20,
  fontFamily: FONT_HAND,
  textAlign: "left",
};

export function createId(): string {
  return "tz_" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

export function createSeed(): number {
  return Math.floor(Math.random() * 2147483647) + 1;
}

export function createDefaultBoard(name: string = "Pizarra Principal"): Board {
  const welcomeElements: TrazzoElement[] = [
    {
      id: createId(),
      type: "rectangle",
      x: 380,
      y: 160,
      width: 480,
      height: 240,
      strokeColor: "#6366f1",
      fillColor: "#e0e7ff",
      fillStyle: "hachure",
      strokeWidth: 2,
      strokeStyle: "solid",
      roughness: 1.2,
      opacity: 1,
      seed: 49201,
    },
    {
      id: createId(),
      type: "text",
      x: 410,
      y: 190,
      width: 420,
      height: 160,
      text: "¡Bienvenido a Trazzo Whiteboard!\n\n• Dibuja libremente con lápiz o figuras\n• Exporta como PNG o archivo .trazzo\n• Guarda y gestiona múltiples pizarras\n• Todo 100% local, rápido y sin registro",
      strokeColor: "#1e1e24",
      fillColor: "transparent",
      fillStyle: "none",
      strokeWidth: 2,
      strokeStyle: "solid",
      roughness: 1,
      opacity: 1,
      fontSize: 20,
      fontFamily: FONT_SANS,
      seed: 83719,
    },
    {
      id: createId(),
      type: "arrow",
      x: 920,
      y: 280,
      width: 140,
      height: -60,
      strokeColor: "#ec4899",
      fillColor: "transparent",
      fillStyle: "none",
      strokeWidth: 3,
      strokeStyle: "solid",
      roughness: 1,
      opacity: 1,
      seed: 19842,
    },
    {
      id: createId(),
      type: "ellipse",
      x: 1080,
      y: 170,
      width: 160,
      height: 120,
      strokeColor: "#10b981",
      fillColor: "#d1fae5",
      fillStyle: "solid",
      strokeWidth: 2,
      strokeStyle: "solid",
      roughness: 1.2,
      opacity: 0.9,
      seed: 57239,
    },
    {
      id: createId(),
      type: "text",
      x: 1100,
      y: 215,
      width: 120,
      height: 40,
      text: "¡Pruébame!",
      strokeColor: "#065f46",
      fillColor: "transparent",
      fillStyle: "none",
      strokeWidth: 2,
      strokeStyle: "solid",
      roughness: 1,
      opacity: 1,
      fontSize: 20,
      fontFamily: FONT_SANS,
      seed: 92831,
    },
  ];

  return {
    id: createId(),
    name,
    elements: welcomeElements,
    viewTransform: { x: 0, y: 0, zoom: 1 },
    backgroundColor: "#ffffff",
    gridEnabled: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function loadBoardsFromStorage(): Board[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BOARDS);
    if (!raw) {
      const defaultBoard = createDefaultBoard();
      saveBoardsToStorage([defaultBoard]);
      return [defaultBoard];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      for (const board of parsed) {
        if (board.elements) {
          for (const el of board.elements) {
            if (
              el.type === "text" &&
              (el.text?.includes("¡Bienvenido a Trazzo") || el.text === "¡Pruébame!") &&
              el.fontFamily &&
              el.fontFamily.includes("Caveat")
            ) {
              el.fontFamily = FONT_SANS;
              if (el.fontSize > 20) el.fontSize = 20;
            }
          }
        }
      }
      return parsed;
    }
    const fallback = createDefaultBoard();
    saveBoardsToStorage([fallback]);
    return [fallback];
  } catch (e) {
    console.error("Error loading boards from localStorage", e);
    return [createDefaultBoard()];
  }
}

export function saveBoardsToStorage(boards: Board[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_BOARDS, JSON.stringify(boards));
  } catch (e) {
    console.error("Error saving boards to localStorage", e);
  }
}

export function loadActiveBoardId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_KEY_ACTIVE);
  } catch {
    return null;
  }
}

export function saveActiveBoardId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE, id);
  } catch (e) {
    console.error("Error saving active board id", e);
  }
}

export function loadToolProperties(): ToolProperties {
  if (typeof window === "undefined") return DEFAULT_TOOL_PROPERTIES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROPS);
    if (raw) {
      return { ...DEFAULT_TOOL_PROPERTIES, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error("Error loading tool props", e);
  }
  return DEFAULT_TOOL_PROPERTIES;
}

export function saveToolProperties(props: ToolProperties): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_PROPS, JSON.stringify(props));
  } catch (e) {
    console.error("Error saving tool props", e);
  }
}

export function loadTheme(): "light" {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY_THEME);
    } catch {}
  }
  return "light";
}

export function saveTheme(_theme?: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY_THEME);
  } catch {}
}
