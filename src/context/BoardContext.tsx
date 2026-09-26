"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import {
  Board,
  Point,
  Tool,
  ToolProperties,
  TrazzoElement,
  ViewTransform,
  TextDraft,
} from "../types/canvas";
import {
  DEFAULT_TOOL_PROPERTIES,
  createDefaultBoard,
  createId,
  createSeed,
  loadActiveBoardId,
  loadBoardsFromStorage,
  loadTheme,
  loadToolProperties,
  saveActiveBoardId,
  saveBoardsToStorage,
  saveToolProperties,
  saveTheme,
} from "../lib/storage";
import { getElementBounds, getCombinedBounds } from "../lib/geometry";
import { AnchorPosition } from "../types/canvas";
import { ToastContainer, ToastItem, ToastType } from "../components/Toast";
import { ConfirmModal, ConfirmDialogState } from "../components/ConfirmModal";
import { BoardsSidebar } from "../components/BoardsSidebar";
import { EmbedModal } from "../components/EmbedModal";


interface BoardContextType {
  boards: Board[];
  activeBoard: Board;
  activeBoardId: string;
  setActiveBoardId: (id: string) => void;
  createNewBoard: (name?: string) => string;
  renameBoard: (id: string, newName: string) => void;
  duplicateBoard: (id: string) => void;
  deleteBoard: (id: string) => void;
  clearCurrentBoard: () => void;
  importBoardsOrElements: (data: { board?: Board; boards?: Board[]; elements?: TrazzoElement[] }) => void;

  viewTransform: ViewTransform;
  setViewTransform: React.Dispatch<React.SetStateAction<ViewTransform>>;
  setZoom: (zoom: number, center?: Point) => void;
  resetZoom: () => void;
  centerContent: (customElements?: TrazzoElement[]) => void;
  panBy: (dx: number, dy: number) => void;

  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
  isToolLocked: boolean;
  setIsToolLocked: React.Dispatch<React.SetStateAction<boolean>>;
  toggleToolLock: () => void;
  toolProps: ToolProperties;
  updateToolProp: <K extends keyof ToolProperties>(key: K, value: ToolProperties[K]) => void;

  editingText: TextDraft | null;
  setEditingText: React.Dispatch<React.SetStateAction<TextDraft | null>>;

  elements: TrazzoElement[];
  setElements: (elements: TrazzoElement[] | ((prev: TrazzoElement[]) => TrazzoElement[]), pushHistory?: boolean) => void;
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  updateSelectedElements: (props: Partial<TrazzoElement>) => void;
  deleteSelectedElements: () => void;
  duplicateSelectedElements: () => void;
  copySelectedElements: () => void;
  pasteElements: () => void;
  cutSelectedElements: () => void;
  createFlowchartStep: (direction?: "up" | "down" | "left" | "right") => void;

  // Layer ordering
  bringToFront: () => void;
  sendToBack: () => void;
  moveForward: () => void;
  moveBackward: () => void;

  // Image insertion
  insertImageFile: (file: File, position?: Point) => Promise<void>;

  // Web Embed insertion
  isEmbedModalOpen: boolean;
  setIsEmbedModalOpen: (open: boolean) => void;
  insertEmbed: (url: string, title?: string, position?: Point) => void;

  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  theme: "light";
  setTheme: (t?: "light") => void;
  gridEnabled: boolean;
  setGridEnabled: (enabled: boolean) => void;

  // Sidebar
  isBoardsSidebarOpen: boolean;
  setIsBoardsSidebarOpen: (open: boolean) => void;


  // Custom Notifications & Confirm
  showToast: (message: string, type?: ToastType) => void;
  confirmDialog: (options: Omit<ConfirmDialogState, "isOpen">) => void;
}

const BoardContext = createContext<BoardContextType | null>(null);

export function BoardProvider({ children }: { children: React.ReactNode }) {
  const [boards, setBoards] = useState<Board[]>([]);
  const [activeBoardId, setActiveBoardIdState] = useState<string>("");
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [isToolLocked, setIsToolLocked] = useState<boolean>(false);
  const toggleToolLock = useCallback(() => {
    setIsToolLocked((prev) => !prev);
  }, []);
  const [toolProps, setToolProps] = useState<ToolProperties>(DEFAULT_TOOL_PROPERTIES);
  const [editingText, setEditingText] = useState<TextDraft | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [theme] = useState<"light">("light");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isBoardsSidebarOpen, setIsBoardsSidebarOpen] = useState(false);

  // Undo / Redo history
  const [history, setHistory] = useState<TrazzoElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Custom Toast system
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = "toast_" + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Custom Confirmation Dialog
  const [confirmDialogState, setConfirmDialogState] = useState<ConfirmDialogState | null>(null);
  const confirmDialog = useCallback((options: Omit<ConfirmDialogState, "isOpen">) => {
    setConfirmDialogState({ ...options, isOpen: true });
  }, []);
  const closeConfirmDialog = useCallback(() => {
    setConfirmDialogState(null);
  }, []);

  // Initialize from LocalStorage
  useEffect(() => {
    const loadedBoards = loadBoardsFromStorage();
    const storedActiveId = loadActiveBoardId();
    const active = loadedBoards.find((b) => b.id === storedActiveId) || loadedBoards[0] || createDefaultBoard();
    
    // Ensure all existing elements have seeds
    const enrichedBoards = loadedBoards.map((b) => ({
      ...b,
      elements: b.elements.map((el) => (el.seed ? el : { ...el, seed: createSeed() })),
    }));

    setBoards(enrichedBoards);
    setActiveBoardIdState(active.id);
    setToolProps(loadToolProperties());
    if (typeof document !== "undefined") {
      document.documentElement.classList.remove("dark");
    }
    saveTheme();
    
    // Set initial history
    setHistory([active.elements]);
    setHistoryIndex(0);
    setIsLoaded(true);
  }, []);

  const activeBoard = boards.find((b) => b.id === activeBoardId) || boards[0] || createDefaultBoard();

  // Save changes to localStorage when boards change
  useEffect(() => {
    if (isLoaded && boards.length > 0) {
      saveBoardsToStorage(boards);
    }
  }, [boards, isLoaded]);

  // Permanently remove dark class on documentElement
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Theme is always white / light
  const setTheme = useCallback((_newTheme?: "light") => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Save active board id
  const setActiveBoardId = useCallback((id: string) => {
    setActiveBoardIdState(id);
    saveActiveBoardId(id);
    const targetBoard = boards.find((b) => b.id === id);
    if (targetBoard) {
      setHistory([targetBoard.elements]);
      setHistoryIndex(0);
      setSelectedIds([]);
      if (targetBoard.viewTransform) {
        setViewTransform(targetBoard.viewTransform);
      }
    }
  }, [boards]);

  // Update elements of the active board
  const setElements = useCallback(
    (
      action: TrazzoElement[] | ((prev: TrazzoElement[]) => TrazzoElement[]),
      pushHistory: boolean = true
    ) => {
      setBoards((prevBoards) => {
        return prevBoards.map((b) => {
          if (b.id !== activeBoardId) return b;
          const nextElements = typeof action === "function" ? action(b.elements) : action;

          if (pushHistory) {
            setHistory((prevHistory) => {
              const newHistory = prevHistory.slice(0, historyIndex + 1);
              return [...newHistory, nextElements];
            });
            setHistoryIndex((prevIndex) => prevIndex + 1);
          }

          return {
            ...b,
            elements: nextElements,
            updatedAt: Date.now(),
          };
        });
      });
    },
    [activeBoardId, historyIndex]
  );

  // Undo / Redo
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const undo = useCallback(() => {
    if (!canUndo) return;
    const targetIndex = historyIndex - 1;
    const targetElements = history[targetIndex];
    setHistoryIndex(targetIndex);
    setBoards((prev) =>
      prev.map((b) => (b.id === activeBoardId ? { ...b, elements: targetElements } : b))
    );
  }, [canUndo, historyIndex, history, activeBoardId]);

  const redo = useCallback(() => {
    if (!canRedo) return;
    const targetIndex = historyIndex + 1;
    const targetElements = history[targetIndex];
    setHistoryIndex(targetIndex);
    setBoards((prev) =>
      prev.map((b) => (b.id === activeBoardId ? { ...b, elements: targetElements } : b))
    );
  }, [canRedo, historyIndex, history, activeBoardId]);

  // View transform
  const viewTransform = activeBoard.viewTransform || { x: 0, y: 0, zoom: 1 };
  const setViewTransform: React.Dispatch<React.SetStateAction<ViewTransform>> = useCallback(
    (action) => {
      setBoards((prev) =>
        prev.map((b) => {
          if (b.id !== activeBoardId) return b;
          const nextTransform =
            typeof action === "function" ? action(b.viewTransform || { x: 0, y: 0, zoom: 1 }) : action;
          return { ...b, viewTransform: nextTransform };
        })
      );
    },
    [activeBoardId]
  );

  const setZoom = useCallback(
    (zoom: number, center?: Point) => {
      const clampedZoom = Math.min(5, Math.max(0.1, zoom));
      setViewTransform((prev) => {
        if (!center) return { ...prev, zoom: clampedZoom };
        const factor = clampedZoom / prev.zoom;
        const newX = center.x - (center.x - prev.x) * factor;
        const newY = center.y - (center.y - prev.y) * factor;
        return { x: newX, y: newY, zoom: clampedZoom };
      });
    },
    [setViewTransform]
  );

  const centerContent = useCallback(
    (customElements?: TrazzoElement[]) => {
      if (typeof window === "undefined") return;
      const targetElements = (customElements || activeBoard.elements || []).filter((el) => !el.isDeleted);
      if (targetElements.length === 0) {
        setViewTransform({ x: 0, y: 0, zoom: 1 });
        return;
      }
      const bounds = getCombinedBounds(targetElements);
      if (!bounds) {
        setViewTransform({ x: 0, y: 0, zoom: 1 });
        return;
      }

      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      // On desktop (>= 768px), the properties panel sits at left-4 with w-64 (256px + 16px + buffer = 280px).
      // Top header/toolbar occupies ~70px.
      const leftOffset = screenWidth >= 768 ? 280 : 0;
      const topOffset = 70;
      const bottomOffset = 40;

      const availWidth = Math.max(300, screenWidth - leftOffset);
      const availHeight = Math.max(200, screenHeight - topOffset - bottomOffset);

      // Desired center in unobstructed screen space
      const targetScreenCenterX = leftOffset + availWidth / 2;
      const targetScreenCenterY = topOffset + availHeight / 2;

      // Content center in world/canvas coordinates
      const contentCenterX = bounds.minX + bounds.width / 2;
      const contentCenterY = bounds.minY + bounds.height / 2;

      // If content is bigger than available viewport, scale it gently to fit with padding
      const padding = 50;
      const scaleX = (availWidth - padding * 2) / Math.max(1, bounds.width);
      const scaleY = (availHeight - padding * 2) / Math.max(1, bounds.height);
      const idealZoom = Math.min(1, Math.min(scaleX, scaleY));
      const clampedZoom = Math.min(2, Math.max(0.2, Math.round(idealZoom * 100) / 100));

      const newX = Math.round(targetScreenCenterX - contentCenterX * clampedZoom);
      const newY = Math.round(targetScreenCenterY - contentCenterY * clampedZoom);

      setViewTransform({ x: newX, y: newY, zoom: clampedZoom });
    },
    [activeBoard.elements, setViewTransform]
  );

  const resetZoom = useCallback(() => {
    centerContent();
  }, [centerContent]);

  const panBy = useCallback(
    (dx: number, dy: number) => {
      setViewTransform((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
    },
    [setViewTransform]
  );

  // Tool properties
  const updateToolProp = useCallback(
    <K extends keyof ToolProperties>(key: K, value: ToolProperties[K]) => {
      setToolProps((prev) => {
        const next = { ...prev, [key]: value };
        saveToolProperties(next);
        return next;
      });

      // Also apply to active text draft if currently editing
      if (editingText) {
        setEditingText((prev) => (prev ? { ...prev, [key]: value } : null));
      }

      // Also apply to currently selected elements
      if (selectedIds.length > 0) {
        setElements((prev) =>
          prev.map((el) => {
            if (!selectedIds.includes(el.id)) return el;
            if (el.type === "text" && (key === "fontSize" || key === "fontFamily" || key === "textAlign")) {
              const nextFontSize = key === "fontSize" ? (value as number) : el.fontSize;
              const nextFontFamily = key === "fontFamily" ? (value as string) : el.fontFamily;
              const nextTextAlign = key === "textAlign" ? (value as any) : el.textAlign;
              const lines = (el.text || "").split("\n");
              const lineHeight = nextFontSize * 1.35;
              const height = Math.max(nextFontSize * 1.5, lines.length * lineHeight);
              const charWidth = nextFontSize * 0.65;
              let maxLineChars = 1;
              for (const l of lines) {
                if (l.length > maxLineChars) maxLineChars = l.length;
              }
              const width = Math.max(40, maxLineChars * charWidth + 24);
              return {
                ...el,
                [key]: value,
                width,
                height,
                fontSize: nextFontSize,
                fontFamily: nextFontFamily,
                textAlign: nextTextAlign,
              } as TrazzoElement;
            }
            return { ...el, [key]: value } as TrazzoElement;
          })
        );
      }
    },
    [selectedIds, setElements, editingText]
  );

  // Selection actions
  const updateSelectedElements = useCallback(
    (props: Partial<TrazzoElement>) => {
      if (selectedIds.length === 0) return;
      setElements((prev) =>
        prev.map((el) => {
          if (selectedIds.includes(el.id)) {
            return { ...el, ...props } as TrazzoElement;
          }
          return el;
        })
      );
    },
    [selectedIds, setElements]
  );

  const deleteSelectedElements = useCallback(() => {
    if (selectedIds.length === 0) return;
    setElements((prev) => prev.filter((el) => !selectedIds.includes(el.id)));
    setSelectedIds([]);
  }, [selectedIds, setElements]);

  const duplicateSelectedElements = useCallback(() => {
    if (selectedIds.length === 0) return;
    const toDuplicate = activeBoard.elements.filter((el) => selectedIds.includes(el.id));
    const idMap = new Map<string, string>();
    for (const el of toDuplicate) {
      idMap.set(el.id, createId());
    }

    const newElements: TrazzoElement[] = toDuplicate.map((el) => {
      const freshId = idMap.get(el.id)!;
      const nextStartBinding =
        el.startBinding && idMap.has(el.startBinding.elementId)
          ? { ...el.startBinding, elementId: idMap.get(el.startBinding.elementId)! }
          : el.startBinding;
      const nextEndBinding =
        el.endBinding && idMap.has(el.endBinding.elementId)
          ? { ...el.endBinding, elementId: idMap.get(el.endBinding.elementId)! }
          : el.endBinding;

      if (el.type === "pencil" && el.points) {
        return {
          ...el,
          id: freshId,
          seed: createSeed(),
          x: el.x + 20,
          y: el.y + 20,
          points: el.points.map((p) => ({ x: p.x + 20, y: p.y + 20 })),
          startBinding: nextStartBinding,
          endBinding: nextEndBinding,
        } as TrazzoElement;
      }

      return {
        ...el,
        id: freshId,
        seed: createSeed(),
        x: el.x + 20,
        y: el.y + 20,
        startBinding: nextStartBinding,
        endBinding: nextEndBinding,
      } as TrazzoElement;
    });

    setElements((prev) => [...prev, ...newElements]);
    setSelectedIds(newElements.map((el) => el.id));
  }, [selectedIds, activeBoard.elements, setElements]);

  const clipboardRef = useRef<TrazzoElement[]>([]);

  const copySelectedElements = useCallback(() => {
    if (selectedIds.length === 0) return;
    const toCopy = activeBoard.elements.filter((el) => selectedIds.includes(el.id));
    clipboardRef.current = toCopy;
    showToast("Elemento copiado al portapapeles", "info");
  }, [selectedIds, activeBoard.elements, showToast]);

  const pasteElements = useCallback(() => {
    if (clipboardRef.current.length === 0) return;
    const idMap = new Map<string, string>();
    for (const el of clipboardRef.current) {
      idMap.set(el.id, createId());
    }

    const newElements: TrazzoElement[] = clipboardRef.current.map((el) => {
      const offset = 25;
      const freshId = idMap.get(el.id)!;
      const nextStartBinding =
        el.startBinding && idMap.has(el.startBinding.elementId)
          ? { ...el.startBinding, elementId: idMap.get(el.startBinding.elementId)! }
          : el.startBinding;
      const nextEndBinding =
        el.endBinding && idMap.has(el.endBinding.elementId)
          ? { ...el.endBinding, elementId: idMap.get(el.endBinding.elementId)! }
          : el.endBinding;

      if (el.type === "pencil" && el.points) {
        return {
          ...el,
          id: freshId,
          seed: createSeed(),
          x: el.x + offset,
          y: el.y + offset,
          points: el.points.map((p) => ({ x: p.x + offset, y: p.y + offset })),
          startBinding: nextStartBinding,
          endBinding: nextEndBinding,
        } as TrazzoElement;
      }
      return {
        ...el,
        id: freshId,
        seed: createSeed(),
        x: el.x + offset,
        y: el.y + offset,
        startBinding: nextStartBinding,
        endBinding: nextEndBinding,
      } as TrazzoElement;
    });

    setElements((prev) => [...prev, ...newElements]);
    setSelectedIds(newElements.map((el) => el.id));
    clipboardRef.current = newElements;
  }, [setElements, setSelectedIds]);

  const cutSelectedElements = useCallback(() => {
    copySelectedElements();
    deleteSelectedElements();
  }, [copySelectedElements, deleteSelectedElements]);

  // Create flowchart step (Ctrl + Arrows)
  const createFlowchartStep = useCallback(
    (direction: "up" | "down" | "left" | "right" = "down") => {
      if (selectedIds.length === 0) return;
      const primaryId = selectedIds[selectedIds.length - 1];
      const sourceEl = activeBoard.elements.find((el) => el.id === primaryId);
      if (!sourceEl || sourceEl.isDeleted) return;

      const b = getElementBounds(sourceEl);
      const gap = 60;
      let targetX = sourceEl.x;
      let targetY = sourceEl.y;
      let arrowStart: Point = { x: 0, y: 0 };
      let arrowEnd: Point = { x: 0, y: 0 };
      let startAnchor: AnchorPosition = "s";
      let endAnchor: AnchorPosition = "n";

      if (direction === "down") {
        targetX = sourceEl.x;
        targetY = sourceEl.y + (b.height + gap);
        arrowStart = { x: b.minX + b.width / 2, y: b.maxY };
        arrowEnd = { x: b.minX + b.width / 2, y: b.maxY + gap };
        startAnchor = "s";
        endAnchor = "n";
      } else if (direction === "up") {
        targetX = sourceEl.x;
        targetY = sourceEl.y - (b.height + gap);
        arrowStart = { x: b.minX + b.width / 2, y: b.minY };
        arrowEnd = { x: b.minX + b.width / 2, y: b.minY - gap };
        startAnchor = "n";
        endAnchor = "s";
      } else if (direction === "right") {
        targetX = sourceEl.x + (b.width + gap);
        targetY = sourceEl.y;
        arrowStart = { x: b.maxX, y: b.minY + b.height / 2 };
        arrowEnd = { x: b.maxX + gap, y: b.minY + b.height / 2 };
        startAnchor = "e";
        endAnchor = "w";
      } else if (direction === "left") {
        targetX = sourceEl.x - (b.width + gap);
        targetY = sourceEl.y;
        arrowStart = { x: b.minX, y: b.minY + b.height / 2 };
        arrowEnd = { x: b.minX - gap, y: b.minY + b.height / 2 };
        startAnchor = "w";
        endAnchor = "e";
      }

      const newShapeId = createId();

      // Connecting arrow with smart bindings
      const arrowEl: TrazzoElement = {
        id: createId(),
        type: "arrow",
        x: arrowStart.x,
        y: arrowStart.y,
        width: arrowEnd.x - arrowStart.x,
        height: arrowEnd.y - arrowStart.y,
        strokeColor: toolProps.strokeColor || "#1e1e1e",
        fillColor: "transparent",
        fillStyle: "none",
        strokeWidth: toolProps.strokeWidth || 2,
        strokeStyle: "solid",
        roughness: toolProps.roughness || 1,
        opacity: 1,
        seed: createSeed(),
        startBinding: { elementId: sourceEl.id, anchor: startAnchor },
        endBinding: { elementId: newShapeId, anchor: endAnchor },
      };

      // Target shape clone
      const newShape: TrazzoElement = {
        ...sourceEl,
        id: newShapeId,
        x: targetX,
        y: targetY,
        seed: createSeed(),
        text: sourceEl.type === "text" ? "" : (sourceEl as any).text,
      } as TrazzoElement;

      setElements((prev) => [...prev, arrowEl, newShape]);
      setSelectedIds([newShape.id]);
      showToast("Paso de diagrama añadido", "info");
    },
    [selectedIds, activeBoard.elements, toolProps, setElements, setSelectedIds, showToast]
  );

  // Layer ordering
  const bringToFront = useCallback(() => {
    if (selectedIds.length === 0) return;
    setElements((prev) => {
      const unselected = prev.filter((el) => !selectedIds.includes(el.id));
      const selected = prev.filter((el) => selectedIds.includes(el.id));
      return [...unselected, ...selected];
    });
  }, [selectedIds, setElements]);

  const sendToBack = useCallback(() => {
    if (selectedIds.length === 0) return;
    setElements((prev) => {
      const unselected = prev.filter((el) => !selectedIds.includes(el.id));
      const selected = prev.filter((el) => selectedIds.includes(el.id));
      return [...selected, ...unselected];
    });
  }, [selectedIds, setElements]);

  const moveForward = useCallback(() => {
    if (selectedIds.length === 0) return;
    setElements((prev) => {
      const arr = [...prev];
      for (let i = arr.length - 2; i >= 0; i--) {
        if (selectedIds.includes(arr[i].id) && !selectedIds.includes(arr[i + 1].id)) {
          const temp = arr[i];
          arr[i] = arr[i + 1];
          arr[i + 1] = temp;
        }
      }
      return arr;
    });
  }, [selectedIds, setElements]);

  const moveBackward = useCallback(() => {
    if (selectedIds.length === 0) return;
    setElements((prev) => {
      const arr = [...prev];
      for (let i = 1; i < arr.length; i++) {
        if (selectedIds.includes(arr[i].id) && !selectedIds.includes(arr[i - 1].id)) {
          const temp = arr[i];
          arr[i] = arr[i - 1];
          arr[i - 1] = temp;
        }
      }
      return arr;
    });
  }, [selectedIds, setElements]);

  // Image insertion helper
  const insertImageFile = useCallback(
    (file: File, position?: Point): Promise<void> => {
      return new Promise((resolve) => {
        if (!file.type.startsWith("image/")) {
          showToast("El archivo seleccionado no es una imagen válida", "error");
          return resolve();
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          if (!dataUrl) return resolve();

          const img = new Image();
          img.onload = () => {
            const maxWidth = 500;
            const maxHeight = 400;
            let w = img.naturalWidth || 300;
            let h = img.naturalHeight || 200;

            if (w > maxWidth || h > maxHeight) {
              const ratio = Math.min(maxWidth / w, maxHeight / h);
              w = Math.round(w * ratio);
              h = Math.round(h * ratio);
            }

            const pos = position
              ? { x: position.x - w / 2, y: position.y - h / 2 }
              : {
                  x: (window.innerWidth / 2 - viewTransform.x) / viewTransform.zoom - w / 2,
                  y: (window.innerHeight / 2 - viewTransform.y) / viewTransform.zoom - h / 2,
                };

            const newEl: TrazzoElement = {
              id: createId(),
              type: "image",
              src: dataUrl,
              x: pos.x,
              y: pos.y,
              width: w,
              height: h,
              aspectRatio: (img.naturalWidth || 300) / (img.naturalHeight || 200),
              strokeColor: "transparent",
              fillColor: "transparent",
              fillStyle: "none",
              strokeWidth: 0,
              strokeStyle: "solid",
              roughness: 0,
              opacity: 1,
              seed: createSeed(),
            };

            setElements((prev) => [...prev, newEl]);
            setSelectedIds([newEl.id]);
            setActiveTool("select");
            showToast("Imagen insertada con éxito", "success");
            resolve();
          };
          img.onerror = () => {
            showToast("No se pudo cargar la imagen", "error");
            resolve();
          };
          img.src = dataUrl;
        };
        reader.onerror = () => {
          showToast("Error al procesar la imagen", "error");
          resolve();
        };
        reader.readAsDataURL(file);
      });
    },
    [viewTransform, setElements, setSelectedIds, setActiveTool, showToast]
  );

  // Web Embed insertion helper
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);

  const insertEmbed = useCallback(
    (url: string, title?: string, position?: Point) => {
      const w = 320;
      const h = 180;
      const pos = position
        ? { x: position.x - w / 2, y: position.y - h / 2 }
        : {
            x: (window.innerWidth / 2 - viewTransform.x) / viewTransform.zoom - w / 2,
            y: (window.innerHeight / 2 - viewTransform.y) / viewTransform.zoom - h / 2,
          };

      const newEl: TrazzoElement = {
        id: createId(),
        type: "embed",
        url,
        title,
        x: Math.round(pos.x),
        y: Math.round(pos.y),
        width: w,
        height: h,
        strokeColor: "#6366f1",
        fillColor: "#ffffff",
        fillStyle: "solid",
        strokeWidth: 1.5,
        strokeStyle: "solid",
        roughness: 0,
        opacity: 1,
        seed: createSeed(),
      };

      setElements((prev) => [...prev, newEl]);
      setSelectedIds([newEl.id]);
      setActiveTool("select");
      showToast("Enlace web incrustado con éxito", "success");
    },
    [viewTransform, theme, setElements, setSelectedIds, setActiveTool, showToast]
  );

  // Board management
  const createNewBoard = useCallback(
    (name?: string) => {
      const count = boards.length + 1;
      const newBoard = createDefaultBoard(name || `Pizarra ${count}`);
      newBoard.elements = [];
      setBoards((prev) => [...prev, newBoard]);
      setActiveBoardIdState(newBoard.id);
      saveActiveBoardId(newBoard.id);
      setHistory([[]]);
      setHistoryIndex(0);
      setSelectedIds([]);
      return newBoard.id;
    },
    [boards.length]
  );

  const renameBoard = useCallback((id: string, newName: string) => {
    if (!newName.trim()) return;
    setBoards((prev) =>
      prev.map((b) => (b.id === id ? { ...b, name: newName.trim(), updatedAt: Date.now() } : b))
    );
  }, []);

  const duplicateBoard = useCallback(
    (id: string) => {
      const target = boards.find((b) => b.id === id);
      if (!target) return;
      const duplicated: Board = {
        ...target,
        id: createId(),
        name: `${target.name} (copia)`,
        elements: target.elements.map((el) => ({ ...el, id: createId(), seed: createSeed() })),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setBoards((prev) => [...prev, duplicated]);
      setActiveBoardIdState(duplicated.id);
      saveActiveBoardId(duplicated.id);
      setHistory([duplicated.elements]);
      setHistoryIndex(0);
      setSelectedIds([]);
    },
    [boards]
  );

  const deleteBoard = useCallback(
    (id: string) => {
      if (boards.length <= 1) {
        showToast("No puedes eliminar la única pizarra disponible.", "warning");
        return;
      }

      const remaining = boards.filter((b) => b.id !== id);
      setBoards(remaining);
      if (activeBoardId === id) {
        const nextActive = remaining[0];
        setActiveBoardIdState(nextActive.id);
        saveActiveBoardId(nextActive.id);
        setHistory([nextActive.elements]);
        setHistoryIndex(0);
        setSelectedIds([]);
        if (nextActive.viewTransform) {
          setViewTransform(nextActive.viewTransform);
        }
      }
    },
    [boards, activeBoardId, showToast]
  );

  const clearCurrentBoard = useCallback(() => {
    confirmDialog({
      title: "Limpiar pizarra",
      message: "¿Deseas borrar todos los elementos y trazos de esta pizarra? Esta acción no se puede deshacer.",
      confirmLabel: "Limpiar pizarra",
      cancelLabel: "Cancelar",
      danger: true,
      onConfirm: () => {
        setElements([]);
        setSelectedIds([]);
        showToast("Pizarra limpiada", "info");
      },
    });
  }, [confirmDialog, setElements, setSelectedIds, showToast]);

  const importBoardsOrElements = useCallback(
    (data: { board?: Board; boards?: Board[]; elements?: TrazzoElement[] }) => {
      if (data.boards && Array.isArray(data.boards) && data.boards.length > 0) {
        const newBoards = [...boards];
        let firstImportedBoard: Board | null = null;
        for (const b of data.boards) {
          const freshBoard: Board = {
            ...b,
            id: createId(),
            name: `${b.name || "Pizarra Importada"}`,
            elements: (b.elements || []).map((el) => ({ ...el, seed: el.seed || createSeed() })),
            updatedAt: Date.now(),
          };
          if (!firstImportedBoard) firstImportedBoard = freshBoard;
          newBoards.push(freshBoard);
        }
        setBoards(newBoards);
        if (firstImportedBoard) {
          setActiveBoardIdState(firstImportedBoard.id);
          saveActiveBoardId(firstImportedBoard.id);
          setHistory([firstImportedBoard.elements || []]);
          setHistoryIndex(0);
          setSelectedIds([]);
        }
        showToast(`¡Se importaron ${data.boards.length} pizarras correctamente!`, "success");
        return;
      }

      if (data.board) {
        const newBoard: Board = {
          ...data.board,
          id: createId(),
          name: `${data.board.name || "Pizarra Importada"}`,
          elements: (data.board.elements || []).map((el) => ({ ...el, seed: el.seed || createSeed() })),
          updatedAt: Date.now(),
        };
        setBoards((prev) => [...prev, newBoard]);
        setActiveBoardIdState(newBoard.id);
        saveActiveBoardId(newBoard.id);
        setHistory([newBoard.elements || []]);
        setHistoryIndex(0);
        setSelectedIds([]);
        showToast(`¡Pizarra "${newBoard.name}" importada con éxito!`, "success");
        return;
      }

      if (data.elements && Array.isArray(data.elements)) {
        const freshElements = data.elements.map((el) => ({
          ...el,
          id: createId(),
          seed: el.seed || createSeed(),
        }));
        setElements((prev) => [...prev, ...freshElements]);
        setSelectedIds(freshElements.map((el) => el.id));
        showToast(`¡Se agregaron ${freshElements.length} elementos a la pizarra actual!`, "success");
      }
    },
    [boards, setElements, showToast]
  );

  const gridEnabled = activeBoard.gridEnabled ?? true;
  const setGridEnabled = useCallback(
    (enabled: boolean) => {
      setBoards((prev) =>
        prev.map((b) => (b.id === activeBoardId ? { ...b, gridEnabled: enabled } : b))
      );
    },
    [activeBoardId]
  );


  return (
    <BoardContext.Provider
      value={{
        boards,
        activeBoard,
        activeBoardId,
        setActiveBoardId,
        createNewBoard,
        renameBoard,
        duplicateBoard,
        deleteBoard,
        clearCurrentBoard,
        importBoardsOrElements,
        viewTransform,
        setViewTransform,
        setZoom,
        resetZoom,
        centerContent,
        panBy,
        activeTool,
        setActiveTool,
        isToolLocked,
        setIsToolLocked,
        toggleToolLock,
        toolProps,
        updateToolProp,
        editingText,
        setEditingText,
        elements: activeBoard.elements || [],
        setElements,
        selectedIds,
        setSelectedIds,
        updateSelectedElements,
        deleteSelectedElements,
        duplicateSelectedElements,
        copySelectedElements,
        pasteElements,
        cutSelectedElements,
        createFlowchartStep,
        bringToFront,
        sendToBack,
        moveForward,
        moveBackward,
        insertImageFile,
        isEmbedModalOpen,
        setIsEmbedModalOpen,
        insertEmbed,
        undo,
        redo,
        canUndo,
        canRedo,
        theme,
        setTheme,
        gridEnabled,
        setGridEnabled,
        isBoardsSidebarOpen,
        setIsBoardsSidebarOpen,
        showToast,
        confirmDialog,
      }}
    >
      {children}
      <BoardsSidebar isOpen={isBoardsSidebarOpen} onClose={() => setIsBoardsSidebarOpen(false)} />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <ConfirmModal dialog={confirmDialogState} onClose={closeConfirmDialog} />
      <EmbedModal isOpen={isEmbedModalOpen} onClose={() => setIsEmbedModalOpen(false)} onEmbed={insertEmbed} />
    </BoardContext.Provider>
  );
}

export function useBoard() {
  const ctx = useContext(BoardContext);
  if (!ctx) {
    throw new Error("useBoard must be used within a BoardProvider");
  }
  return ctx;
}
