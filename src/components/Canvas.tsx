"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import rough from "roughjs";
import { UploadCloud } from "lucide-react";
import { useBoard } from "../context/BoardContext";
import { Point, ResizeHandle, TrazzoElement, TextDraft, AnchorPosition } from "../types/canvas";
import {
  getElementBounds,
  getCombinedBounds,
  isPointNearElement,
  isElementInBox,
  getElementHandles,
  getHandleAtPosition,
  AnchorPoint,
  getElementAnchors,
  findNearestAnchor,
  updateBoundArrows,
  isPointInPolygon,
  isElementInPolygon,
} from "../lib/geometry";
import { drawGrid, drawMarquee, drawSelectionBox, renderElement, resolveThemeColor } from "../lib/renderer";
import { createId, createSeed, FONT_HAND } from "../lib/storage";
import { parseTrazzoFile } from "../lib/export";
import { ContextMenu } from "./ContextMenu";
import { recognizeShape } from "../lib/shapeRecognizer";
import {
  DEFAULT_LASER_CONFIG,
  LaserPoint,
  pruneLaserPoints,
  renderLaserTrail,
} from "../lib/laser";

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const {
    activeBoard,
    elements,
    setElements,
    viewTransform,
    setViewTransform,
    setZoom,
    centerContent,
    panBy,
    activeTool,
    setActiveTool,
    isToolLocked,
    toggleToolLock,
    createFlowchartStep,
    toolProps,
    selectedIds,
    setSelectedIds,
    theme,
    gridEnabled,
    undo,
    redo,
    deleteSelectedElements,
    duplicateSelectedElements,
    copySelectedElements,
    pasteElements,
    cutSelectedElements,
    bringToFront,
    sendToBack,
    moveForward,
    moveBackward,
    insertImageFile,
    showToast,
    importBoardsOrElements,
    editingText,
    setEditingText,
  } = useBoard();

  const isDark = false;

  // Interaction state
  const [isInteracting, setIsInteracting] = useState(false);
  const [interactionType, setInteractionType] = useState<
    "drawing" | "moving" | "resizing" | "panning" | "marquee" | "laser" | "lasso" | null
  >(null);

  const [activeHandle, setActiveHandle] = useState<ResizeHandle | null>(null);
  const [hoveredHandle, setHoveredHandle] = useState<ResizeHandle | null>(null);
  const [dragStartPoint, setDragStartPoint] = useState<Point>({ x: 0, y: 0 });
  const [currentElement, setCurrentElement] = useState<TrazzoElement | null>(null);
  const [marqueeBox, setMarqueeBox] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Laser Pointer presentation trail
  const laserPointsRef = useRef<LaserPoint[]>([]);
  const isLaserActiveRef = useRef(false);
  const laserAnimRunningRef = useRef(false);
  const [laserTick, setLaserTick] = useState(0);

  // Lasso Selection polygon points
  const lassoPointsRef = useRef<Point[]>([]);
  const [lassoSlate, setLassoSlate] = useState<Point[]>([]);

  // Frame contained children moving
  const frameContainedIdsRef = useRef<string[]>([]);

  // Smart connectors & magnetic anchor states
  const [snapAnchor, setSnapAnchor] = useState<AnchorPoint | null>(null);
  const [candidateAnchors, setCandidateAnchors] = useState<AnchorPoint[]>([]);

  // Multi-touch tracking for pinch-to-zoom
  const activePointers = useRef<Map<number, Point>>(new Map());
  const lastPinchDist = useRef<number | null>(null);

  // Moving elements snapshot
  const initialElementsSnapshot = useRef<TrazzoElement[]>([]);
  // Element being resized snapshot
  const initialResizeElement = useRef<TrazzoElement | null>(null);

  // Moving elements active IDs to prevent 1-frame race conditions
  const movingIdsRef = useRef<string[]>([]);

  // Right-click context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    targetElementId?: string | null;
  } | null>(null);

  // File input ref for inserting images via context menu
  const canvasImageInputRef = useRef<HTMLInputElement | null>(null);

  // Text inline editing synchronization and double-commit guard
  const editingTextRef = useRef<TextDraft | null>(null);
  const isCommittingRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Laser fade animation loop (active on-demand, sleeps automatically when points decay)
  const startLaserLoopIfNeeded = useCallback(() => {
    if (laserAnimRunningRef.current) return;
    laserAnimRunningRef.current = true;

    const step = () => {
      if (!laserAnimRunningRef.current) return;
      const now = Date.now();
      if (isLaserActiveRef.current && laserPointsRef.current.length > 0) {
        const pts = laserPointsRef.current;
        pts[pts.length - 1].time = now;
      }
      const countBefore = laserPointsRef.current.length;
      laserPointsRef.current = pruneLaserPoints(
        laserPointsRef.current,
        now,
        DEFAULT_LASER_CONFIG.lifespanMs,
        true
      );
      if (laserPointsRef.current.length > 0 || countBefore > 0) {
        setLaserTick((t) => (t + 1) % 1000000);
      }
      if (laserPointsRef.current.length > 0 || isLaserActiveRef.current) {
        requestAnimationFrame(step);
      } else {
        laserAnimRunningRef.current = false;
      }
    };
    requestAnimationFrame(step);
  }, []);

  useEffect(() => {
    return () => {
      laserAnimRunningRef.current = false;
    };
  }, []);

  useEffect(() => {
    editingTextRef.current = editingText;
  }, [editingText]);

  // Auto-focus and position caret when editingText is set or reopened
  useEffect(() => {
    if (editingText && textareaRef.current) {
      const el = textareaRef.current;
      el.focus();
      const len = el.value.length;
      el.setSelectionRange(len, len);
      const rId = requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(len, len);
      });
      return () => cancelAnimationFrame(rId);
    }
  }, [editingText?.sessionKey]);

  // Spacebar pan detection
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Screen to Canvas coordinate
  const screenToCanvas = useCallback(
    (screenX: number, screenY: number): Point => {
      return {
        x: (screenX - viewTransform.x) / viewTransform.zoom,
        y: (screenY - viewTransform.y) / viewTransform.zoom,
      };
    },
    [viewTransform]
  );

  // Canvas to Screen coordinate
  const canvasToScreen = useCallback(
    (canvasX: number, canvasY: number): Point => {
      return {
        x: canvasX * viewTransform.zoom + viewTransform.x,
        y: canvasY * viewTransform.zoom + viewTransform.y,
      };
    },
    [viewTransform]
  );

  // Resize canvas to window
  const updateCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    const height = container.clientHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
  }, []);

  useEffect(() => {
    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, [updateCanvasSize]);

  // Auto-center content on initial load so it is never obstructed by the floating left properties panel
  const hasAutoCenteredRef = useRef(false);
  const activeBoardIdRef = useRef(activeBoard.id);

  useEffect(() => {
    if (activeBoardIdRef.current !== activeBoard.id) {
      activeBoardIdRef.current = activeBoard.id;
      hasAutoCenteredRef.current = false;
    }

    if (hasAutoCenteredRef.current) return;

    if (elements.length > 0) {
      if (viewTransform.x === 0 && viewTransform.y === 0) {
        const timer = setTimeout(() => {
          centerContent();
          hasAutoCenteredRef.current = true;
        }, 50);
        return () => clearTimeout(timer);
      } else {
        hasAutoCenteredRef.current = true;
      }
    }
  }, [activeBoard.id, elements.length, viewTransform.x, viewTransform.y, centerContent]);

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);

    // Clear background
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const dpr = window.devicePixelRatio || 1;
    ctx.scale(dpr, dpr);

    const isDark = false;
    ctx.fillStyle = "#fbfbfe";
    ctx.fillRect(0, 0, width, height);

    // Draw Grid
    if (gridEnabled) {
      drawGrid(ctx, width, height, viewTransform, isDark);
    }

    // Apply View Transform
    ctx.translate(viewTransform.x, viewTransform.y);
    ctx.scale(viewTransform.zoom, viewTransform.zoom);

    const rc = rough.canvas(canvas);

    // Render elements
    for (const el of elements) {
      if (editingText && editingText.id === el.id) continue; // Hide while editing
      renderElement(ctx, rc, el, isDark);
    }

    // Render in-progress drawing element
    if (currentElement) {
      renderElement(ctx, rc, currentElement, isDark);
    }

    // Render Selection Outlines
    if (selectedIds.length > 0) {
      const selectedElements = elements.filter((el) => selectedIds.includes(el.id));
      if (selectedElements.length === 1) {
        const bounds = getElementBounds(selectedElements[0]);
        drawSelectionBox(ctx, bounds, true, selectedElements[0], viewTransform.zoom, isDark);
      } else if (selectedElements.length > 1) {
        const combined = getCombinedBounds(selectedElements);
        if (combined) {
          drawSelectionBox(ctx, combined, false, undefined, viewTransform.zoom, isDark);
        }
      }
    }

    // Render Marquee Selection Box
    if (marqueeBox) {
      drawMarquee(ctx, marqueeBox, isDark);
    }

    // Render Magnetic Snap Anchors for Smart Connectors (Arrows & Lines)
    if (candidateAnchors.length > 0 || snapAnchor) {
      ctx.save();
      const anchorBg = isDark ? "#1e1e24" : "#ffffff";
      const anchorStroke = isDark ? "#818cf8" : "#6366f1";
      for (const a of candidateAnchors) {
        const isSnapped =
          snapAnchor && snapAnchor.elementId === a.elementId && snapAnchor.anchor === a.anchor;
        if (!isSnapped) {
          ctx.beginPath();
          ctx.arc(a.x, a.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = anchorBg;
          ctx.fill();
          ctx.strokeStyle = anchorStroke;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      if (snapAnchor) {
        // Outer halo ring
        ctx.beginPath();
        ctx.arc(snapAnchor.x, snapAnchor.y, 9, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? "rgba(129, 140, 248, 0.3)" : "rgba(79, 70, 229, 0.25)";
        ctx.fill();
        ctx.strokeStyle = isDark ? "#818cf8" : "#4f46e5";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Inner solid dot
        ctx.beginPath();
        ctx.arc(snapAnchor.x, snapAnchor.y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? "#818cf8" : "#4f46e5";
        ctx.fill();
        ctx.strokeStyle = anchorBg;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.restore();
    }

    // Render Lasso Selection Polygon
    const activeLasso = lassoSlate.length > 1 ? lassoSlate : lassoPointsRef.current;
    if (activeLasso.length > 1) {
      ctx.save();
      ctx.beginPath();
      const lp = activeLasso;
      ctx.moveTo(lp[0].x, lp[0].y);
      for (let i = 1; i < lp.length; i++) {
        ctx.lineTo(lp[i].x, lp[i].y);
      }
      ctx.closePath();
      ctx.fillStyle = "rgba(99, 102, 241, 0.12)";
      ctx.fill();
      ctx.strokeStyle = "#4f46e5";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.restore();
    }

    // Render Laser Pointer Glowing Trail
    if (laserPointsRef.current.length > 0) {
      const now = Date.now();
      renderLaserTrail(ctx, laserPointsRef.current, now, isLaserActiveRef.current, {
        scale: 1 / Math.max(0.1, Math.min(10, viewTransform.zoom)),
      });
    }

    ctx.restore();
  }, [
    elements,
    viewTransform,
    theme,
    gridEnabled,
    currentElement,
    selectedIds,
    marqueeBox,
    editingText,
    candidateAnchors,
    snapAnchor,
    laserTick,
    lassoSlate,
  ]);

  // Keyboard navigation & shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input or textarea
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.code === "Space" && !isSpacePressed) {
        setIsSpacePressed(true);
      }

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
        return;
      }

      // Enter to insert or edit text
      if (e.key === "Enter") {
        e.preventDefault();
        // 1. If text element selected: reopen in-place
        if (selectedIds.length === 1) {
          const selectedEl = elements.find((el) => el.id === selectedIds[0]);
          if (selectedEl && selectedEl.type === "text") {
            setEditingText({
              sessionKey: createId(),
              id: selectedEl.id,
              x: selectedEl.x,
              y: selectedEl.y,
              text: selectedEl.text,
              fontSize: selectedEl.fontSize,
              fontFamily: selectedEl.fontFamily,
              strokeColor: selectedEl.strokeColor,
              textAlign: selectedEl.textAlign || "left",
              anchorCenterX:
                selectedEl.textAlign === "center"
                  ? selectedEl.x + selectedEl.width / 2
                  : undefined,
            });
            return;
          } else if (selectedEl) {
            // Shape selected: center text in shape
            const b = getElementBounds(selectedEl);
            const cx = b.minX + b.width / 2;
            const cy = b.minY + b.height / 2;
            setEditingText({
              sessionKey: createId(),
              x: cx,
              y: cy,
              anchorCenterX: cx,
              anchorCenterY: cy,
              text: "",
              fontSize: toolProps.fontSize,
              fontFamily: toolProps.fontFamily,
              strokeColor: toolProps.strokeColor,
              textAlign: "center",
            });
            return;
          }
        }

        // 2. Otherwise center in viewport
        const container = containerRef.current;
        const cx = container ? container.clientWidth / 2 : 400;
        const cy = container ? container.clientHeight / 2 : 300;
        const canvasPoint = screenToCanvas(cx, cy);
        setEditingText({
          sessionKey: createId(),
          x: canvasPoint.x,
          y: canvasPoint.y,
          text: "",
          fontSize: toolProps.fontSize,
          fontFamily: toolProps.fontFamily,
          strokeColor: toolProps.strokeColor,
          textAlign: toolProps.textAlign || "left",
        });
        return;
      }

      // Flowchart creation [Ctrl + ↑↓←→]
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "ArrowRight" || e.key === "ArrowLeft")
      ) {
        e.preventDefault();
        const dir =
          e.key === "ArrowDown"
            ? "down"
            : e.key === "ArrowUp"
            ? "up"
            : e.key === "ArrowRight"
            ? "right"
            : "left";
        createFlowchartStep(dir);
        return;
      }

      // Delete
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteSelectedElements();
        return;
      }

      // Duplicate
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicateSelectedElements();
        return;
      }

      // Copy (Ctrl+C / Cmd+C)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
        e.preventDefault();
        copySelectedElements();
        return;
      }

      // Cut (Ctrl+X / Cmd+X)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "x") {
        e.preventDefault();
        cutSelectedElements();
        return;
      }

      // Select All
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setSelectedIds(elements.filter((el) => !el.isDeleted).map((el) => el.id));
        return;
      }

      // Escape
      if (e.key === "Escape") {
        setSelectedIds([]);
        setActiveTool("select");
        if (editingText) {
          commitText();
        }
        return;
      }

      // Layer Ordering shortcuts
      if (e.key === "]" || e.key === "}") {
        e.preventDefault();
        if (e.shiftKey || e.ctrlKey || e.metaKey) {
          bringToFront();
        } else {
          moveForward();
        }
        return;
      }
      if (e.key === "[" || e.key === "{") {
        e.preventDefault();
        if (e.shiftKey || e.ctrlKey || e.metaKey) {
          sendToBack();
        } else {
          moveBackward();
        }
        return;
      }

      // Lock toggle
      const key = e.key.toLowerCase();
      if (key === "q") {
        e.preventDefault();
        toggleToolLock();
        return;
      }

      // Draw to shape shortcut (Shift+X)
      if (e.shiftKey && key === "x") {
        e.preventDefault();
        setActiveTool("draw-to-shape");
        return;
      }

      // Center Content in View (Shift + 1 or Ctrl/Cmd + 0)
      if (
        (e.shiftKey && (e.key === "!" || e.key === "1")) ||
        ((e.ctrlKey || e.metaKey) && e.key === "0")
      ) {
        e.preventDefault();
        centerContent();
        return;
      }

      // Tool Switcher keys
      if (key === "h" || key === "1") setActiveTool("hand");
      else if (key === "v" || key === "2") setActiveTool("select");
      else if (key === "r" || key === "3") setActiveTool("rectangle");
      else if (key === "d" || key === "4") setActiveTool("diamond");
      else if (key === "o" || key === "c" || key === "5") setActiveTool("ellipse");
      else if (key === "a" || key === "6") setActiveTool("arrow");
      else if (key === "l" || key === "7") setActiveTool("line");
      else if (key === "p" || key === "8") setActiveTool("pencil");
      else if (key === "t") setActiveTool("text");
      else if (key === "i" || key === "9") {
        canvasImageInputRef.current?.click();
      }
      else if (key === "e" || key === "0") setActiveTool("eraser");
      else if (key === "f") setActiveTool("frame");
      else if (key === "k") setActiveTool("laser");
      else if (key === "b") setActiveTool("bucket");
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsSpacePressed(false);
      }
    };

    const handlePasteEvent = (e: ClipboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      // 1. Check for image files on system clipboard
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.startsWith("image/")) {
            const file = items[i].getAsFile();
            if (file) {
              e.preventDefault();
              insertImageFile(file);
              return;
            }
          }
        }
      }

      // 2. Check for .trazzo JSON content on clipboard
      const text = e.clipboardData?.getData("text/plain");
      if (text) {
        try {
          const parsed = parseTrazzoFile(text);
          if (parsed && (parsed.board || parsed.boards || parsed.elements)) {
            e.preventDefault();
            importBoardsOrElements(parsed);
            return;
          }
        } catch {}
      }

      // 3. Otherwise paste internal copied elements
      e.preventDefault();
      pasteElements();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("paste", handlePasteEvent);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("paste", handlePasteEvent);
    };
  }, [
    isSpacePressed,
    undo,
    redo,
    deleteSelectedElements,
    duplicateSelectedElements,
    copySelectedElements,
    pasteElements,
    cutSelectedElements,
    bringToFront,
    sendToBack,
    moveForward,
    moveBackward,
    insertImageFile,
    setSelectedIds,
    selectedIds,
    toolProps,
    screenToCanvas,
    createFlowchartStep,
    toggleToolLock,
    elements,
    editingText,
    setActiveTool,
  ]);

  // Text commit
  const commitText = useCallback(() => {
    const draft = editingTextRef.current;
    if (!draft) return;
    if (isCommittingRef.current) return;
    isCommittingRef.current = true;
    editingTextRef.current = null;
    setEditingText(null);

    const rawText = draft.text.replace(/\r\n/g, "\n");
    if (!rawText.trim()) {
      if (draft.id) {
        setElements((prev) => prev.filter((el) => el.id !== draft.id));
      }
      if (!isToolLocked && activeTool === "text") {
        setActiveTool("select");
      }
      setTimeout(() => {
        isCommittingRef.current = false;
      }, 50);
      return;
    }

    const text = rawText.replace(/^\n+|\n+$/g, "");
    const lines = text.split("\n");
    const fontSize = draft.fontSize || 20;
    const lineHeight = fontSize * 1.35;
    const height = Math.max(fontSize * 1.5, lines.length * lineHeight);

    let maxLineWidth = 20;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.font = `${fontSize}px ${draft.fontFamily || FONT_HAND}`;
        for (const line of lines) {
          const w = ctx.measureText(line).width;
          if (w > maxLineWidth) maxLineWidth = w;
        }
      }
    }
    if (maxLineWidth <= 20) {
      const maxChars = Math.max(...lines.map((l) => l.length));
      maxLineWidth = Math.max(20, maxChars * (fontSize * 0.6));
    }
    const width = maxLineWidth;

    const align = draft.textAlign || "left";
    let finalX = draft.x;
    let finalY = draft.y;

    if (align === "center") {
      const targetCenterX = draft.anchorCenterX !== undefined ? draft.anchorCenterX : draft.x;
      finalX = targetCenterX - width / 2;
    } else if (align === "right") {
      finalX = draft.x - width;
    }

    if (draft.anchorCenterY !== undefined) {
      finalY = draft.anchorCenterY - height / 2;
    }

    if (draft.id) {
      // Update existing text
      setElements((prev) =>
        prev.map((el) =>
          el.id === draft.id
            ? {
                ...el,
                text,
                x: finalX,
                y: finalY,
                width,
                height,
                fontSize,
                fontFamily: draft.fontFamily,
                strokeColor: draft.strokeColor,
                textAlign: align,
              }
            : el
        )
      );
      setSelectedIds([draft.id]);
    } else {
      // Create new text element
      const newEl: TrazzoElement = {
        id: createId(),
        type: "text",
        x: finalX,
        y: finalY,
        width,
        height,
        text,
        fontSize,
        fontFamily: draft.fontFamily,
        strokeColor: draft.strokeColor,
        fillColor: "transparent",
        fillStyle: "none",
        strokeWidth: 1,
        strokeStyle: "solid",
        roughness: 1,
        opacity: 1,
        seed: createSeed(),
        textAlign: align,
      };
      setElements((prev) => [...prev, newEl]);
      setSelectedIds([newEl.id]);
    }

    if (!isToolLocked && activeTool === "text") {
      setActiveTool("select");
    }

    setTimeout(() => {
      isCommittingRef.current = false;
    }, 50);
  }, [isToolLocked, activeTool, setElements, setSelectedIds, setActiveTool, setEditingText]);

  // Find element at point, prioritizing non-frame children so framed elements can be clicked/manipulated
  const findHitElement = useCallback(
    (point: Point) => {
      const nonFrame = elements
        .slice()
        .reverse()
        .find((el) => el.type !== "frame" && isPointNearElement(point, el));
      if (nonFrame) return nonFrame;
      return elements
        .slice()
        .reverse()
        .find((el) => el.type === "frame" && isPointNearElement(point, el));
    },
    [elements]
  );

  // Pointer Down
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (activePointers.current.size === 2) {
      const pts = Array.from(activePointers.current.values());
      lastPinchDist.current = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      return;
    }

    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const canvasPoint = screenToCanvas(screenX, screenY);

    setDragStartPoint(canvasPoint);
    setContextMenu(null);

    // Commit pending text editing if clicking outside
    if (editingText) {
      commitText();
      return;
    }

    // Panning (Space held, middle mouse button, or hand tool)
    if (isSpacePressed || e.button === 1 || activeTool === "hand") {
      setIsInteracting(true);
      setInteractionType("panning");
      return;
    }

    // Eraser Tool
    if (activeTool === "eraser") {
      setIsInteracting(true);
      const hit = findHitElement(canvasPoint);
      if (hit) {
        setElements((prev) => prev.filter((el) => el.id !== hit.id));
      }
      return;
    }

    // Laser Pointer Tool
    if (activeTool === "laser") {
      setIsInteracting(true);
      setInteractionType("laser");
      isLaserActiveRef.current = true;
      laserPointsRef.current.push({
        x: canvasPoint.x,
        y: canvasPoint.y,
        time: Date.now(),
        newStroke: true,
      });
      startLaserLoopIfNeeded();
      setLaserTick((t) => (t + 1) % 1000000);
      return;
    }

    // Lasso Selection Tool
    if (activeTool === "lasso") {
      setIsInteracting(true);
      setInteractionType("lasso");
      const initialPts = [{ x: canvasPoint.x, y: canvasPoint.y }];
      lassoPointsRef.current = initialPts;
      setLassoSlate(initialPts);
      return;
    }

    // Bucket Fill Tool
    if (activeTool === "bucket") {
      const hit = findHitElement(canvasPoint);
      if (hit) {
        let nextFill = toolProps.fillColor;
        let nextStyle = toolProps.fillStyle;
        if (!nextFill || nextFill === "transparent" || nextStyle === "none") {
          nextFill = toolProps.strokeColor ? `${toolProps.strokeColor}33` : "#6366f133";
          nextStyle = "solid";
        }
        setElements(
          (prev) =>
            prev.map((el) =>
              el.id === hit.id
                ? { ...el, fillColor: nextFill, fillStyle: nextStyle }
                : el
            ),
          true
        );
        showToast("Elemento coloreado con bote de pintura", "info");
      }
      return;
    }

    // Text Tool
    if (activeTool === "text") {
      e.preventDefault();
      setEditingText({
        sessionKey: createId(),
        x: canvasPoint.x,
        y: canvasPoint.y,
        text: "",
        fontSize: toolProps.fontSize,
        fontFamily: toolProps.fontFamily,
        strokeColor: toolProps.strokeColor,
        textAlign: toolProps.textAlign || "left",
      });
      return;
    }

    // Select Tool
    if (activeTool === "select") {
      // 1. Check if clicking on a resize handle of a single selected element
      if (selectedIds.length === 1) {
        const selectedEl = elements.find((el) => el.id === selectedIds[0]);
        if (selectedEl) {
          const handle = getHandleAtPosition(canvasPoint, selectedEl, 10 / viewTransform.zoom);
          if (handle) {
            setIsInteracting(true);
            setInteractionType("resizing");
            setActiveHandle(handle);
            initialResizeElement.current = JSON.parse(JSON.stringify(selectedEl));
            return;
          }
        }
      }

      // 2. Check if clicking on an element
      const hit = findHitElement(canvasPoint);

      if (hit) {
        let nextSelected: string[];
        if (e.shiftKey) {
          // Toggle selection with shift
          if (selectedIds.includes(hit.id)) {
            nextSelected = selectedIds.filter((id) => id !== hit.id);
          } else {
            nextSelected = [...selectedIds, hit.id];
          }
          setSelectedIds(nextSelected);
        } else {
          // If hit is not already selected, select it
          if (!selectedIds.includes(hit.id)) {
            nextSelected = [hit.id];
            setSelectedIds([hit.id]);
          } else {
            nextSelected = selectedIds;
          }
        }

        // If a frame was clicked, calculate contained elements so they move along
        if (hit.type === "frame") {
          const b = getElementBounds(hit);
          const contained = elements.filter((el) => {
            if (el.id === hit.id || el.isDeleted) return false;
            const eb = getElementBounds(el);
            return (
              eb.minX >= b.minX &&
              eb.maxX <= b.maxX &&
              eb.minY >= b.minY &&
              eb.maxY <= b.maxY
            );
          });
          frameContainedIdsRef.current = contained.map((el) => el.id);
        } else {
          frameContainedIdsRef.current = [];
        }

        movingIdsRef.current = nextSelected;
        setIsInteracting(true);
        setInteractionType("moving");
        initialElementsSnapshot.current = JSON.parse(JSON.stringify(elements));
        return;
      }

      // 3. Clicked on empty space: start marquee selection box
      setSelectedIds([]);
      setIsInteracting(true);
      setInteractionType("marquee");
      setMarqueeBox({
        x1: canvasPoint.x,
        y1: canvasPoint.y,
        x2: canvasPoint.x,
        y2: canvasPoint.y,
      });
      return;
    }

    // Drawing shapes: rectangle, diamond, ellipse, line, arrow, pencil, frame, draw-to-shape
    setIsInteracting(true);
    setInteractionType("drawing");

    const newId = createId();

    if (activeTool === "pencil" || activeTool === "draw-to-shape") {
      const pencilEl: TrazzoElement = {
        id: newId,
        type: "pencil",
        x: canvasPoint.x,
        y: canvasPoint.y,
        width: 0,
        height: 0,
        points: [{ x: canvasPoint.x, y: canvasPoint.y }],
        strokeColor: toolProps.strokeColor,
        fillColor: "transparent",
        fillStyle: "none",
        strokeWidth: toolProps.strokeWidth,
        strokeStyle: toolProps.strokeStyle,
        roughness: activeTool === "draw-to-shape" ? 0 : toolProps.roughness,
        opacity: toolProps.opacity,
        seed: createSeed(),
      };
      setCurrentElement(pencilEl);
    } else if (activeTool === "frame") {
      const frameCount = elements.filter((el) => el.type === "frame").length;
      const frameEl: TrazzoElement = {
        id: newId,
        type: "frame",
        name: `Marco ${frameCount + 1}`,
        x: canvasPoint.x,
        y: canvasPoint.y,
        width: 1,
        height: 1,
        strokeColor: toolProps.strokeColor || "#94a3b8",
        fillColor: toolProps.fillColor !== "transparent" ? toolProps.fillColor : "transparent",
        fillStyle: toolProps.fillStyle,
        strokeWidth: toolProps.strokeWidth || 1.5,
        strokeStyle: "dashed",
        roughness: 0,
        opacity: toolProps.opacity || 1,
        seed: createSeed(),
      };
      setCurrentElement(frameEl);
    } else {
      let startX = canvasPoint.x;
      let startY = canvasPoint.y;
      let initialStartBinding = null;

      if (activeTool === "line" || activeTool === "arrow") {
        const nearestAnchor = findNearestAnchor(canvasPoint, elements, undefined, 24);
        if (nearestAnchor) {
          startX = nearestAnchor.x;
          startY = nearestAnchor.y;
          initialStartBinding = {
            elementId: nearestAnchor.elementId,
            anchor: nearestAnchor.anchor,
          };
          setSnapAnchor(nearestAnchor);
        }
      }

      const shapeEl: TrazzoElement = {
        id: newId,
        type: activeTool as any,
        x: startX,
        y: startY,
        width: 1,
        height: 1,
        strokeColor: toolProps.strokeColor,
        fillColor: toolProps.fillColor,
        fillStyle: toolProps.fillStyle,
        strokeWidth: toolProps.strokeWidth,
        strokeStyle: toolProps.strokeStyle,
        roughness: toolProps.roughness,
        opacity: toolProps.opacity,
        seed: createSeed(),
        startBinding: initialStartBinding,
        endBinding: null,
      };
      setCurrentElement(shapeEl);
    }
  };

  // Pointer Move
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Handle 2-finger pinch to zoom
    if (activePointers.current.size === 2 && lastPinchDist.current !== null) {
      const pts = Array.from(activePointers.current.values());
      const currentDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (lastPinchDist.current > 0 && currentDist > 0) {
        const midX = (pts[0].x + pts[1].x) / 2;
        const midY = (pts[0].y + pts[1].y) / 2;
        const canvasMid = screenToCanvas(midX - rect.left, midY - rect.top);
        const factor = currentDist / lastPinchDist.current;
        setZoom(viewTransform.zoom * factor, canvasMid);
      }
      lastPinchDist.current = currentDist;
      return;
    }

    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const canvasPoint = screenToCanvas(screenX, screenY);

    // Eraser while dragging
    if (isInteracting && activeTool === "eraser") {
      const hit = findHitElement(canvasPoint);
      if (hit) {
        setElements((prev) => prev.filter((el) => el.id !== hit.id));
      }
      return;
    }

    // Laser while dragging / interacting
    if (interactionType === "laser") {
      const now = Date.now();
      const pts = laserPointsRef.current;
      if (pts.length > 0) {
        const last = pts[pts.length - 1];
        const distSq = (canvasPoint.x - last.x) ** 2 + (canvasPoint.y - last.y) ** 2;
        if (distSq >= 4 || now - last.time > 16) {
          laserPointsRef.current.push({ x: canvasPoint.x, y: canvasPoint.y, time: now });
        } else {
          last.x = canvasPoint.x;
          last.y = canvasPoint.y;
          last.time = now;
        }
      } else {
        laserPointsRef.current.push({ x: canvasPoint.x, y: canvasPoint.y, time: now, newStroke: true });
      }
      startLaserLoopIfNeeded();
      setLaserTick((t) => (t + 1) % 1000000);
      return;
    }

    // Lasso selection while dragging
    if (interactionType === "lasso") {
      lassoPointsRef.current.push({ x: canvasPoint.x, y: canvasPoint.y });
      setLassoSlate([...lassoPointsRef.current]);
      return;
    }

    // Hover handle detection when not interacting
    if (!isInteracting) {
      if (activeTool === "arrow" || activeTool === "line") {
        const nearby = elements
          .filter((el) => !el.isDeleted && el.type !== "line" && el.type !== "arrow")
          .flatMap((el) => getElementAnchors(el))
          .filter((a) => Math.hypot(canvasPoint.x - a.x, canvasPoint.y - a.y) < 90);
        setCandidateAnchors(nearby);
        const snapped = findNearestAnchor(canvasPoint, elements, undefined, 24);
        setSnapAnchor(snapped);
      } else {
        if (candidateAnchors.length > 0) setCandidateAnchors([]);
        if (snapAnchor) setSnapAnchor(null);
      }

      if (activeTool === "select" && selectedIds.length === 1) {
        const selectedEl = elements.find((el) => el.id === selectedIds[0]);
        if (selectedEl) {
          const h = getHandleAtPosition(canvasPoint, selectedEl, 10 / viewTransform.zoom);
          setHoveredHandle(h);
        } else {
          setHoveredHandle(null);
        }
      } else {
        setHoveredHandle(null);
      }
      return;
    }

    // Panning
    if (interactionType === "panning") {
      panBy(e.movementX, e.movementY);
      return;
    }

    // Marquee Selection Box
    if (interactionType === "marquee" && marqueeBox) {
      const newBox = {
        ...marqueeBox,
        x2: canvasPoint.x,
        y2: canvasPoint.y,
      };
      setMarqueeBox(newBox);

      // Select elements within marquee
      const matchingIds = elements
        .filter((el) => isElementInBox(el, newBox))
        .map((el) => el.id);
      setSelectedIds(matchingIds);
      return;
    }

    // Moving elements
    if (interactionType === "moving") {
      const dx = canvasPoint.x - dragStartPoint.x;
      const dy = canvasPoint.y - dragStartPoint.y;

      const activeMoveIds = [
        ...(movingIdsRef.current.length > 0 ? movingIdsRef.current : selectedIds),
        ...frameContainedIdsRef.current,
      ];
      const snapshotMap = new Map(initialElementsSnapshot.current.map((el) => [el.id, el]));

      const movedElements = initialElementsSnapshot.current.map((snap) => {
        if (!activeMoveIds.includes(snap.id)) return snap;
        if (snap.type === "pencil" && snap.points) {
          return {
            ...snap,
            x: snap.x + dx,
            y: snap.y + dy,
            points: snap.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
          } as TrazzoElement;
        }

        // If arrow was dragged directly on its own without its attached shapes, detach bindings
        if (snap.type === "line" || snap.type === "arrow") {
          const keepsStart = snap.startBinding && activeMoveIds.includes(snap.startBinding.elementId);
          const keepsEnd = snap.endBinding && activeMoveIds.includes(snap.endBinding.elementId);
          return {
            ...snap,
            x: snap.x + dx,
            y: snap.y + dy,
            startBinding: keepsStart ? snap.startBinding : null,
            endBinding: keepsEnd ? snap.endBinding : null,
          } as TrazzoElement;
        }

        return {
          ...snap,
          x: snap.x + dx,
          y: snap.y + dy,
        } as TrazzoElement;
      });

      // Smart connectors: automatically update all arrows bound to moving shapes!
      const fullyConnected = updateBoundArrows(movedElements);
      setElements(fullyConnected, false);
      return;
    }

    // Resizing element
    if (interactionType === "resizing" && activeHandle && initialResizeElement.current) {
      const snap = initialResizeElement.current;
      const dx = canvasPoint.x - dragStartPoint.x;
      const dy = canvasPoint.y - dragStartPoint.y;

      let newX = snap.x;
      let newY = snap.y;
      let newW = snap.width;
      let newH = snap.height;
      let newStartBinding = snap.startBinding;
      let newEndBinding = snap.endBinding;

      if (snap.type === "line" || snap.type === "arrow") {
        if (activeHandle === "start") {
          const nearest = findNearestAnchor(canvasPoint, elements, snap.id, 24);
          if (nearest) {
            newX = nearest.x;
            newY = nearest.y;
            newW = snap.x + snap.width - nearest.x;
            newH = snap.y + snap.height - nearest.y;
            newStartBinding = { elementId: nearest.elementId, anchor: nearest.anchor };
            setSnapAnchor(nearest);
          } else {
            newX = snap.x + dx;
            newY = snap.y + dy;
            newW = snap.width - dx;
            newH = snap.height - dy;
            newStartBinding = null;
            setSnapAnchor(null);
          }
        } else {
          const targetPoint = { x: snap.x + snap.width + dx, y: snap.y + snap.height + dy };
          const nearest = findNearestAnchor(targetPoint, elements, snap.id, 24);
          if (nearest) {
            newW = nearest.x - snap.x;
            newH = nearest.y - snap.y;
            newEndBinding = { elementId: nearest.elementId, anchor: nearest.anchor };
            setSnapAnchor(nearest);
          } else {
            newW = snap.width + dx;
            newH = snap.height + dy;
            newEndBinding = null;
            setSnapAnchor(null);
          }
        }
      } else if (snap.type === "image") {
        const ratio =
          (snap as any).aspectRatio ||
          (snap.width > 0 && snap.height > 0 ? Math.abs(snap.width) / Math.abs(snap.height) : 1);
        switch (activeHandle) {
          case "se": {
            newW = Math.max(24, snap.width + dx);
            newH = Math.round(newW / ratio);
            break;
          }
          case "ne": {
            newW = Math.max(24, snap.width + dx);
            newH = Math.round(newW / ratio);
            newY = snap.y + (snap.height - newH);
            break;
          }
          case "sw": {
            newW = Math.max(24, snap.width - dx);
            newH = Math.round(newW / ratio);
            newX = snap.x + (snap.width - newW);
            break;
          }
          case "nw": {
            newW = Math.max(24, snap.width - dx);
            newH = Math.round(newW / ratio);
            newX = snap.x + (snap.width - newW);
            newY = snap.y + (snap.height - newH);
            break;
          }
          case "e": {
            newW = Math.max(24, snap.width + dx);
            newH = Math.round(newW / ratio);
            break;
          }
          case "w": {
            newW = Math.max(24, snap.width - dx);
            newH = Math.round(newW / ratio);
            newX = snap.x + (snap.width - newW);
            break;
          }
          case "s": {
            newH = Math.max(24, snap.height + dy);
            newW = Math.round(newH * ratio);
            break;
          }
          case "n": {
            newH = Math.max(24, snap.height - dy);
            newW = Math.round(newH * ratio);
            newY = snap.y + (snap.height - newH);
            break;
          }
        }
      } else {
        switch (activeHandle) {
          case "nw":
            newX = snap.x + dx;
            newY = snap.y + dy;
            newW = snap.width - dx;
            newH = snap.height - dy;
            break;
          case "n":
            newY = snap.y + dy;
            newH = snap.height - dy;
            break;
          case "ne":
            newY = snap.y + dy;
            newW = snap.width + dx;
            newH = snap.height - dy;
            break;
          case "e":
            newW = snap.width + dx;
            break;
          case "se":
            newW = snap.width + dx;
            newH = snap.height + dy;
            break;
          case "s":
            newH = snap.height + dy;
            break;
          case "sw":
            newX = snap.x + dx;
            newW = snap.width - dx;
            newH = snap.height + dy;
            break;
          case "w":
            newX = snap.x + dx;
            newW = snap.width - dx;
            break;
        }
      }

      setElements(
        (prev) => {
          const updated = prev.map((el) => {
            if (el.id !== snap.id) return el;

            if (snap.type === "pencil" && snap.points) {
              const initBounds = getElementBounds(snap);
              const scaleX = initBounds.width > 0 ? Math.abs(newW) / initBounds.width : 1;
              const scaleY = initBounds.height > 0 ? Math.abs(newH) / initBounds.height : 1;
              const targetX = Math.min(newX, newX + newW);
              const targetY = Math.min(newY, newY + newH);
              const scaledPoints = snap.points.map((p) => ({
                x: targetX + (p.x - initBounds.minX) * scaleX,
                y: targetY + (p.y - initBounds.minY) * scaleY,
              }));
              return {
                ...el,
                x: targetX,
                y: targetY,
                width: Math.abs(newW),
                height: Math.abs(newH),
                points: scaledPoints,
              } as TrazzoElement;
            }

            return {
              ...el,
              x: newX,
              y: newY,
              width: newW,
              height: newH,
              startBinding: newStartBinding,
              endBinding: newEndBinding,
            } as TrazzoElement;
          });

          // Re-evaluate arrows bound to resized shapes
          return updateBoundArrows(updated);
        },
        false
      );
      return;
    }

    // Drawing in progress
    if (interactionType === "drawing" && currentElement) {
      if (currentElement.type === "pencil") {
        setCurrentElement((prev) => {
          if (!prev || prev.type !== "pencil") return prev;
          const nextPoints = [...prev.points, { x: canvasPoint.x, y: canvasPoint.y }];
          return {
            ...prev,
            points: nextPoints,
          };
        });
      } else if (currentElement.type === "arrow" || currentElement.type === "line") {
        const nearest = findNearestAnchor(canvasPoint, elements, currentElement.id, 24);
        if (nearest) {
          setSnapAnchor(nearest);
          const w = nearest.x - currentElement.x;
          const h = nearest.y - currentElement.y;
          setCurrentElement((prev) =>
            prev
              ? {
                  ...prev,
                  width: w,
                  height: h,
                  endBinding: { elementId: nearest.elementId, anchor: nearest.anchor },
                }
              : null
          );
        } else {
          setSnapAnchor(null);
          const w = canvasPoint.x - currentElement.x;
          const h = canvasPoint.y - currentElement.y;
          setCurrentElement((prev) =>
            prev
              ? {
                  ...prev,
                  width: w,
                  height: h,
                  endBinding: null,
                }
              : null
          );
        }
      } else {
        const w = canvasPoint.x - currentElement.x;
        const h = canvasPoint.y - currentElement.y;
        setCurrentElement((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            width: w,
            height: h,
          };
        });
      }
    }
  };

  // Pointer Up
  const handlePointerUp = (e?: React.PointerEvent<HTMLCanvasElement>) => {
    isLaserActiveRef.current = false;
    setSnapAnchor(null);
    setCandidateAnchors([]);

    if (e) {
      activePointers.current.delete(e.pointerId);
      if (activePointers.current.size < 2) {
        lastPinchDist.current = null;
      }
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }

    if (!isInteracting) return;

    if (interactionType === "laser") {
      isLaserActiveRef.current = false;
      setIsInteracting(false);
      setInteractionType(null);
      return;
    }

    if (interactionType === "lasso") {
      const pts = lassoPointsRef.current;
      if (pts.length > 2) {
        const matched = elements
          .filter((el) => isElementInPolygon(el, pts))
          .map((el) => el.id);
        setSelectedIds(matched);
        if (matched.length > 0) {
          showToast(`${matched.length} elemento(s) seleccionado(s)`, "info");
        }
        if (!isToolLocked) {
          setActiveTool("select");
        }
      }
      lassoPointsRef.current = [];
      setLassoSlate([]);
      setIsInteracting(false);
      setInteractionType(null);
      return;
    }

    if (interactionType === "drawing" && currentElement) {
      if (activeTool === "draw-to-shape" && currentElement.type === "pencil") {
        const rec = recognizeShape(currentElement.points);
        if (rec.type === "rectangle" || rec.type === "diamond" || rec.type === "ellipse") {
          const shapeEl: TrazzoElement = {
            id: createId(),
            type: rec.type,
            x: rec.bounds.minX,
            y: rec.bounds.minY,
            width: rec.bounds.width,
            height: rec.bounds.height,
            strokeColor: toolProps.strokeColor,
            fillColor: toolProps.fillColor,
            fillStyle: toolProps.fillStyle,
            strokeWidth: toolProps.strokeWidth,
            strokeStyle: toolProps.strokeStyle,
            roughness: 1,
            opacity: toolProps.opacity,
            seed: createSeed(),
          };
          setElements((prev) => [...prev, shapeEl]);
          setSelectedIds([shapeEl.id]);
          showToast(`Forma detectada: ${rec.label}`, "info");
        } else if (rec.type === "line") {
          const lineEl: TrazzoElement = {
            id: createId(),
            type: "line",
            x: rec.startPoint.x,
            y: rec.startPoint.y,
            width: rec.endPoint.x - rec.startPoint.x,
            height: rec.endPoint.y - rec.startPoint.y,
            strokeColor: toolProps.strokeColor,
            fillColor: "transparent",
            fillStyle: "none",
            strokeWidth: toolProps.strokeWidth,
            strokeStyle: toolProps.strokeStyle,
            roughness: 1,
            opacity: toolProps.opacity,
            seed: createSeed(),
          };
          setElements((prev) => [...prev, lineEl]);
          setSelectedIds([lineEl.id]);
          showToast("Forma detectada: Línea recta", "info");
        } else if (rec.type === "arrow") {
          const arrowEl: TrazzoElement = {
            id: createId(),
            type: "arrow",
            x: rec.startPoint.x,
            y: rec.startPoint.y,
            width: rec.endPoint.x - rec.startPoint.x,
            height: rec.endPoint.y - rec.startPoint.y,
            strokeColor: toolProps.strokeColor,
            fillColor: "transparent",
            fillStyle: "none",
            strokeWidth: toolProps.strokeWidth,
            strokeStyle: toolProps.strokeStyle,
            roughness: 1,
            opacity: toolProps.opacity,
            seed: createSeed(),
          };
          setElements((prev) => [...prev, arrowEl]);
          setSelectedIds([arrowEl.id]);
          showToast("Forma detectada: Flecha", "info");
        } else {
          setElements((prev) => [...prev, currentElement]);
          setSelectedIds([currentElement.id]);
        }
        setCurrentElement(null);
        if (!isToolLocked) {
          setActiveTool("select");
        }
        setIsInteracting(false);
        setInteractionType(null);
        setActiveHandle(null);
        setMarqueeBox(null);
        return;
      }

      if (currentElement.type === "frame") {
        const x = Math.min(currentElement.x, currentElement.x + currentElement.width);
        const y = Math.min(currentElement.y, currentElement.y + currentElement.height);
        const w = Math.abs(currentElement.width);
        const h = Math.abs(currentElement.height);
        if (w >= 10 && h >= 10) {
          const frameEl: TrazzoElement = { ...currentElement, x, y, width: w, height: h };
          const fb = { minX: x, maxX: x + w, minY: y, maxY: y + h };
          setElements((prev) => {
            // Find index of first element contained inside this frame so frame stays behind
            const firstChildIdx = prev.findIndex((el) => {
              if (el.isDeleted) return false;
              const eb = getElementBounds(el);
              return (
                eb.minX >= fb.minX &&
                eb.maxX <= fb.maxX &&
                eb.minY >= fb.minY &&
                eb.maxY <= fb.maxY
              );
            });
            if (firstChildIdx !== -1) {
              const next = [...prev];
              next.splice(firstChildIdx, 0, frameEl);
              return next;
            }
            return [...prev, frameEl];
          });
          setSelectedIds([frameEl.id]);
        }
        setCurrentElement(null);
        if (!isToolLocked) {
          setActiveTool("select");
        }
        setIsInteracting(false);
        setInteractionType(null);
        setActiveHandle(null);
        setMarqueeBox(null);
        return;
      }

      // Validate element has size
      const isTiny =
        currentElement.type !== "pencil" &&
        Math.abs(currentElement.width) < 3 &&
        Math.abs(currentElement.height) < 3;

      if (!isTiny) {
        // Normalize coordinates for box shapes
        let finalized = { ...currentElement };
        if (
          finalized.type === "rectangle" ||
          finalized.type === "diamond" ||
          finalized.type === "ellipse"
        ) {
          const x = Math.min(finalized.x, finalized.x + finalized.width);
          const y = Math.min(finalized.y, finalized.y + finalized.height);
          const w = Math.abs(finalized.width);
          const h = Math.abs(finalized.height);
          finalized = { ...finalized, x, y, width: w, height: h };
        }

        setElements((prev) => [...prev, finalized]);
        setSelectedIds([finalized.id]);
      }
      setCurrentElement(null);
      // Switch back to select for shapes, keep active tool if locked
      if (!isToolLocked) {
        if (activeTool !== "pencil") {
          setActiveTool("select");
        }
      }
    }

    if (interactionType === "resizing") {
      setElements((prev) =>
        prev.map((el) => {
          if (!selectedIds.includes(el.id)) return el;
          if (
            el.type === "rectangle" ||
            el.type === "diamond" ||
            el.type === "ellipse" ||
            el.type === "image" ||
            el.type === "frame" ||
            el.type === "embed"
          ) {
            const x = Math.min(el.x, el.x + el.width);
            const y = Math.min(el.y, el.y + el.height);
            const width = Math.abs(el.width);
            const height = Math.abs(el.height);
            return { ...el, x, y, width, height };
          }
          return el;
        }),
        true
      );
    } else if (interactionType === "moving") {
      // Push history commit
      setElements((prev) => [...prev], true);
    }

    setIsInteracting(false);
    setInteractionType(null);
    setActiveHandle(null);
    setMarqueeBox(null);
  };

  // Double Click for Text or editing
  const handleDoubleClick = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const canvasPoint = screenToCanvas(screenX, screenY);

    const hit = findHitElement(canvasPoint);
    if (hit) {
      if (hit.type === "embed") {
        const url = hit.url.startsWith("http") ? hit.url : `https://${hit.url}`;
        window.open(url, "_blank");
        showToast("Abriendo enlace web en nueva pestaña", "info");
        return;
      }
      if (hit.type === "text") {
        setEditingText({
          sessionKey: createId(),
          id: hit.id,
          x: hit.x,
          y: hit.y,
          text: hit.text,
          fontSize: hit.fontSize,
          fontFamily: hit.fontFamily,
          strokeColor: hit.strokeColor,
          textAlign: hit.textAlign || "left",
          anchorCenterX:
            hit.textAlign === "center" ? hit.x + hit.width / 2 : undefined,
        });
      } else {
        // Shape double clicked: center text in shape
        const b = getElementBounds(hit);
        const cx = b.minX + b.width / 2;
        const cy = b.minY + b.height / 2;
        setEditingText({
          sessionKey: createId(),
          x: cx,
          y: cy,
          anchorCenterX: cx,
          anchorCenterY: cy,
          text: "",
          fontSize: toolProps.fontSize,
          fontFamily: toolProps.fontFamily,
          strokeColor: toolProps.strokeColor,
          textAlign: "center",
        });
      }
      return;
    }

    // Quick create text at clicked empty spot
    setEditingText({
      sessionKey: createId(),
      x: canvasPoint.x,
      y: canvasPoint.y,
      text: "",
      fontSize: toolProps.fontSize,
      fontFamily: toolProps.fontFamily,
      strokeColor: toolProps.strokeColor,
      textAlign: toolProps.textAlign || "left",
    });
  };

  // Mouse Wheel (Zoom & Pan)
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (e.ctrlKey || e.metaKey) {
      // Zoom centered at mouse position
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const canvasPoint = screenToCanvas(screenX, screenY);

      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const newZoom = viewTransform.zoom * zoomFactor;
      setZoom(newZoom, canvasPoint);
    } else {
      // Pan
      panBy(-e.deltaX, -e.deltaY);
    }
  };

  // Cursor style
  const getCursor = () => {
    if (isSpacePressed || activeTool === "hand") {
      return isInteracting ? "grabbing" : "grab";
    }
    if (activeTool === "eraser") return "cell";
    if (activeTool === "text") return "text";
    if (
      [
        "rectangle",
        "diamond",
        "ellipse",
        "line",
        "arrow",
        "pencil",
        "frame",
        "draw-to-shape",
        "laser",
        "bucket",
        "lasso",
      ].includes(activeTool)
    ) {
      return "crosshair";
    }

    const handleForCursor =
      interactionType === "resizing" && activeHandle
        ? activeHandle
        : activeTool === "select"
        ? hoveredHandle
        : null;

    if (handleForCursor) {
      if (handleForCursor === "nw" || handleForCursor === "se") return "nwse-resize";
      if (handleForCursor === "ne" || handleForCursor === "sw") return "nesw-resize";
      if (handleForCursor === "n" || handleForCursor === "s") return "ns-resize";
      if (handleForCursor === "e" || handleForCursor === "w") return "ew-resize";
      if (handleForCursor === "start" || handleForCursor === "end") return "crosshair";
    }

    return "default";
  };

  // Drag & drop file or library item onto canvas
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes("Files")) {
      setIsDraggingFile(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget === e.target) {
      setIsDraggingFile(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (file.type.startsWith("image/")) {
      const rect = canvasRef.current?.getBoundingClientRect();
      const dropPos = rect
        ? screenToCanvas(e.clientX - rect.left, e.clientY - rect.top)
        : undefined;
      insertImageFile(file, dropPos);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseTrazzoFile(text);
        importBoardsOrElements(parsed);
      } catch (err: any) {
        showToast(err.message || "Error al importar el archivo .trazzo", "error");
      }
    };
    reader.readAsText(file);
  };

  // Inline Text Editor screen coordinates
  const textAnchorX = editingText
    ? editingText.textAlign === "center" && editingText.anchorCenterX !== undefined
      ? editingText.anchorCenterX
      : editingText.x
    : 0;
  const textAnchorY = editingText
    ? editingText.textAlign === "center" && editingText.anchorCenterY !== undefined
      ? editingText.anchorCenterY
      : editingText.y
    : 0;
  const textScreenPos = editingText ? canvasToScreen(textAnchorX, textAnchorY) : { x: 0, y: 0 };

  // Right-click context menu
  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const canvasPoint = screenToCanvas(screenX, screenY);

    const hit = elements.slice().reverse().find((el) => isPointNearElement(canvasPoint, el));

    if (hit) {
      if (!selectedIds.includes(hit.id)) {
        setSelectedIds([hit.id]);
      }
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        targetElementId: hit.id,
      });
    } else {
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        targetElementId: null,
      });
    }
  };

  const handleCanvasImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      insertImageFile(file);
    }
    if (canvasImageInputRef.current) {
      canvasImageInputRef.current.value = "";
    }
  };

  return (
    <div
      ref={containerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative w-full h-full overflow-hidden select-none"
      style={{ cursor: getCursor() }}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
        className="block touch-none"
      />

      {/* Drag & Drop Visual Overlay */}
      {isDraggingFile && (
        <div className="absolute inset-0 z-40 bg-indigo-600/15 backdrop-blur-xs border-4 border-dashed border-indigo-500 rounded-2xl flex flex-col items-center justify-center pointer-events-none animate-in fade-in duration-150">
          <div className="p-6 rounded-3xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl shadow-2xl flex flex-col items-center gap-2 border border-indigo-200 dark:border-indigo-900">
            <UploadCloud size={46} className="text-indigo-600 dark:text-indigo-400 animate-bounce" />
            <span className="font-bold text-base text-neutral-800 dark:text-neutral-100">
              Suelta tu imagen o archivo .trazzo aquí
            </span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              Se agregará a tu pizarra al instante
            </span>
          </div>
        </div>
      )}

      {/* Inline Auto-Expanding Text Editor */}
      {editingText && (
        <div
          className="absolute z-30 pointer-events-auto select-text"
          style={{
            left: `${textScreenPos.x}px`,
            top: `${textScreenPos.y}px`,
            transform:
              editingText.textAlign === "center"
                ? editingText.anchorCenterY !== undefined
                  ? `scale(${viewTransform.zoom}) translate(-50%, -50%)`
                  : `scale(${viewTransform.zoom}) translate(-50%, 0)`
                : editingText.textAlign === "right"
                ? `scale(${viewTransform.zoom}) translate(-100%, 0)`
                : `scale(${viewTransform.zoom})`,
            transformOrigin:
              editingText.textAlign === "center"
                ? editingText.anchorCenterY !== undefined
                  ? "center center"
                  : "top center"
                : editingText.textAlign === "right"
                ? "top right"
                : "top left",
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              display: "grid",
              minWidth: "40px",
              maxWidth: "85vw",
            }}
          >
            {/* Ghost mirror element that expands width and height dynamically */}
            <div
              aria-hidden="true"
              style={{
                fontFamily: editingText.fontFamily,
                fontSize: `${editingText.fontSize}px`,
                lineHeight: 1.35,
                textAlign: editingText.textAlign || "left",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                visibility: "hidden",
                gridArea: "1 / 1 / 2 / 2",
                padding: "0 2px",
                border: "1px dashed transparent",
                margin: "-1px -3px",
                minHeight: "1.4em",
              }}
            >
              {(editingText.text || " ") + "\n"}
            </div>

            {/* In-place interactive textarea */}
            <textarea
              ref={textareaRef}
              value={editingText.text}
              onChange={(e) =>
                setEditingText((prev) => (prev ? { ...prev, text: e.target.value } : null))
              }
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onDoubleClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (e.ctrlKey || e.metaKey || !editingText.text.trim()) {
                    e.preventDefault();
                    commitText();
                    return;
                  }
                  // Normal Enter key inserts newline in multiline text
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  commitText();
                } else if (e.key === "Tab") {
                  e.preventDefault();
                  const target = e.currentTarget;
                  const start = target.selectionStart;
                  const end = target.selectionEnd;
                  const val = target.value;
                  const nextVal = val.substring(0, start) + "  " + val.substring(end);
                  setEditingText((prev) => (prev ? { ...prev, text: nextVal } : null));
                  setTimeout(() => {
                    target.selectionStart = target.selectionEnd = start + 2;
                  }, 0);
                }
              }}
              onBlur={commitText}
              placeholder="Escribe texto..."
              style={{
                fontFamily: editingText.fontFamily,
                fontSize: `${editingText.fontSize}px`,
                lineHeight: 1.35,
                textAlign: editingText.textAlign || "left",
                color: resolveThemeColor(editingText.strokeColor, isDark, true),
                gridArea: "1 / 1 / 2 / 2",
                padding: "0 2px",
                margin: "-1px -3px",
                resize: "none",
                overflow: "hidden",
                background: "transparent",
                outline: "none",
                boxSizing: "border-box",
                border: isDark ? "1px dashed rgba(165, 180, 252, 0.8)" : "1px dashed rgba(99, 102, 241, 0.8)",
                borderRadius: "3px",
              }}
              className="select-text caret-indigo-600 dark:caret-indigo-400 shadow-xs"
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Right-click Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          targetElementId={contextMenu.targetElementId}
          onClose={() => setContextMenu(null)}
          onTriggerInsertImage={() => canvasImageInputRef.current?.click()}
        />
      )}

      {/* Hidden file input for context menu image insertion */}
      <input
        ref={canvasImageInputRef}
        type="file"
        accept="image/*"
        onChange={handleCanvasImageChange}
        className="hidden"
      />
    </div>
  );
}
