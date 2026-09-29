import rough from "roughjs";
import { getStroke } from "perfect-freehand";
import type { TrazzoElement, Point } from "../types/canvas.ts";

export function getSvgPathFromStroke(stroke: number[][]): string {
  if (!stroke.length) return "";

  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ["M", ...stroke[0], "Q"]
  );

  d.push("Z");
  return d.join(" ");
}

const imageCache = new Map<string, HTMLImageElement>();

export function getCachedImage(src: string, onLoaded?: () => void): HTMLImageElement | null {
  if (imageCache.has(src)) {
    return imageCache.get(src)!;
  }
  if (typeof window === "undefined") return null;
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    imageCache.set(src, img);
    if (onLoaded) onLoaded();
  };
  img.src = src;
  imageCache.set(src, img);
  return img;
}

export function preloadImage(src: string): Promise<HTMLImageElement> {
  if (imageCache.has(src)) {
    const existing = imageCache.get(src)!;
    if (existing.complete && existing.naturalWidth > 0) return Promise.resolve(existing);
  }
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(null as any);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = () => {
      resolve(img);
    };
    img.src = src;
  });
}

/**
 * Theme color helpers & intelligent contrast mapping
 */
export function parseColorToRgb(color: string): { r: number; g: number; b: number } | null {
  if (!color || color === "transparent" || color === "none") return null;
  const c = color.trim().toLowerCase();
  if (c.startsWith("#")) {
    let hex = c.slice(1);
    if (hex.length === 3) {
      hex = hex.split("").map((x) => x + x).join("");
    }
    if (hex.length >= 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        return { r, g, b };
      }
    }
  } else if (c.startsWith("rgb")) {
    const match = c.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (match) {
      return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
    }
  }
  return null;
}

export function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function isColorDark(color: string): boolean {
  if (!color || color === "transparent" || color === "none") return false;
  const rgb = parseColorToRgb(color);
  if (!rgb) return false;
  return getRelativeLuminance(rgb.r, rgb.g, rgb.b) < 0.35;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Canonical light-to-dark palette mappings
const LIGHT_TO_DARK_STROKE: Record<string, string> = {
  "#1e1e1e": "#f8f9fa",
  "#1e1e24": "#f8f9fa",
  "#000000": "#f8f9fa",
  "#111827": "#f8f9fa",
  "#121212": "#f8f9fa",
  "#121214": "#f8f9fa",
  "#18181b": "#f8f9fa",
  "#262626": "#f8f9fa",
  "#27272a": "#f8f9fa",
  "#2d3748": "#f8f9fa",
  "#333333": "#f8f9fa",
  "#374151": "#f8f9fa",
  "#0f172a": "#f8f9fa",
  "#1e293b": "#f8f9fa",

  "#697077": "#ced4da",
  "#64748b": "#cbd5e1",
  "#4b5563": "#d1d5db",

  "#e03131": "#ff8787",
  "#ef4444": "#f87171",
  "#dc2626": "#fca5a5",

  "#2f9e44": "#69db7c",
  "#16a34a": "#4ade80",
  "#15803d": "#86efac",

  "#1971c2": "#74c0fc",
  "#2563eb": "#60a5fa",
  "#1d4ed8": "#93c5fd",

  "#f08c00": "#ffd43b",
  "#d97706": "#fcd34d",
  "#b45309": "#fde047",

  "#6366f1": "#a5b4fc",
  "#4f46e5": "#c7d2fe",
  "#7c3aed": "#c4b5fd",

  "#ec4899": "#f472b6",
  "#db2777": "#f9a8d4",
};

const DARK_TO_LIGHT_STROKE: Record<string, string> = {
  "#f8f9fa": "#1e1e1e",
  "#fbfbfe": "#1e1e1e",
  "#ffffff": "#1e1e1e",
  "#fff": "#1e1e1e",
  "#f1f3f5": "#1e1e1e",
  "#f3f4f6": "#1e1e1e",
  "#f8fafc": "#1e1e1e",
  "#e2e8f0": "#1e1e1e",
  "#e5e7eb": "#1e1e1e",

  "#ced4da": "#697077",
  "#cbd5e1": "#64748b",
  "#d1d5db": "#4b5563",

  "#ff8787": "#e03131",
  "#f87171": "#ef4444",
  "#fca5a5": "#dc2626",

  "#69db7c": "#2f9e44",
  "#4ade80": "#16a34a",
  "#86efac": "#15803d",

  "#74c0fc": "#1971c2",
  "#60a5fa": "#2563eb",
  "#93c5fd": "#1d4ed8",

  "#ffd43b": "#f08c00",
  "#fcd34d": "#d97706",
  "#fde047": "#b45309",

  "#a5b4fc": "#6366f1",
  "#c7d2fe": "#4f46e5",
  "#c4b5fd": "#7c3aed",

  "#f472b6": "#ec4899",
  "#f9a8d4": "#db2777",
};

/**
 * Resolves element stroke or fill color according to theme (light vs dark).
 * Ensures diagrams drawn in light mode look crisp and legible in dark mode, and vice versa!
 */
export function resolveThemeColor(
  color: string,
  isDark: boolean,
  isStroke: boolean = true,
  fillStyle?: string
): string {
  if (!color || color === "transparent" || color === "none") return color;
  const normalized = color.trim().toLowerCase();

  if (isDark) {
    if (isStroke) {
      if (LIGHT_TO_DARK_STROKE[normalized]) {
        return LIGHT_TO_DARK_STROKE[normalized];
      }
      const rgb = parseColorToRgb(normalized);
      if (rgb) {
        const lum = getRelativeLuminance(rgb.r, rgb.g, rgb.b);
        // If color is too dark for dark mode, boost lightness so contrast is high
        if (lum < 0.25) {
          const [h, s, l] = rgbToHsl(rgb.r, rgb.g, rgb.b);
          const targetL = Math.max(0.72, 1 - l);
          const [r2, g2, b2] = hslToRgb(h, s, targetL);
          return rgbToHex(r2, g2, b2);
        }
      }
      return color;
    } else {
      // Fill color in dark mode
      if (fillStyle === "solid") {
        if (["#ffffff", "#fff", "#fbfbfe", "#f8f9fa", "#f1f3f5"].includes(normalized)) {
          return "#232328"; // Subtle dark surface instead of blinding white block
        }
        if (["#1e1e1e", "#000000", "#121214", "#18181b"].includes(normalized)) {
          return "#f8f9fa";
        }
      }
      return color;
    }
  } else {
    // Light mode
    if (isStroke) {
      if (DARK_TO_LIGHT_STROKE[normalized]) {
        return DARK_TO_LIGHT_STROKE[normalized];
      }
      const rgb = parseColorToRgb(normalized);
      if (rgb) {
        const lum = getRelativeLuminance(rgb.r, rgb.g, rgb.b);
        // If color is too light for light mode, lower lightness so contrast is high
        if (lum > 0.75) {
          const [h, s, l] = rgbToHsl(rgb.r, rgb.g, rgb.b);
          const targetL = Math.min(0.28, 1 - l);
          const [r2, g2, b2] = hslToRgb(h, s, targetL);
          return rgbToHex(r2, g2, b2);
        }
      }
      return color;
    } else {
      // Fill color in light mode
      if (fillStyle === "solid") {
        if (["#232328", "#121214", "#18181b", "#1e1e1e"].includes(normalized)) {
          return "#ffffff";
        }
      }
      return color;
    }
  }
}

export function renderElement(
  ctx: CanvasRenderingContext2D,
  rc: ReturnType<typeof rough.canvas>,
  element: TrazzoElement,
  isDark: boolean = false
) {
  if (element.isDeleted) return;

  ctx.save();
  ctx.globalAlpha = element.opacity;

  const strokeDash =
    element.strokeStyle === "dashed"
      ? [8, 8]
      : element.strokeStyle === "dotted"
      ? [3, 4]
      : undefined;

  const resolvedStroke = resolveThemeColor(element.strokeColor, isDark, true);
  const resolvedFill =
    element.fillStyle !== "none"
      ? resolveThemeColor(element.fillColor, isDark, false, element.fillStyle)
      : undefined;

  const roughOptions = {
    stroke: resolvedStroke,
    strokeWidth: element.strokeWidth,
    roughness: element.roughness,
    strokeLineDash: strokeDash,
    fill: element.fillStyle !== "none" ? resolvedFill : undefined,
    fillStyle: element.fillStyle === "none" ? undefined : element.fillStyle,
    fillWeight: element.strokeWidth / 2,
    hachureAngle: 60,
    hachureGap: Math.max(4, element.strokeWidth * 3),
    seed: element.seed && element.seed > 0 ? element.seed : 1,
  };

  switch (element.type) {
    case "rectangle": {
      const x = Math.min(element.x, element.x + element.width);
      const y = Math.min(element.y, element.y + element.height);
      const w = Math.abs(element.width);
      const h = Math.abs(element.height);
      rc.rectangle(x, y, w, h, roughOptions);
      break;
    }

    case "diamond": {
      const minX = Math.min(element.x, element.x + element.width);
      const maxX = Math.max(element.x, element.x + element.width);
      const minY = Math.min(element.y, element.y + element.height);
      const maxY = Math.max(element.y, element.y + element.height);
      const midX = (minX + maxX) / 2;
      const midY = (minY + maxY) / 2;

      rc.polygon(
        [
          [midX, minY],
          [maxX, midY],
          [midX, maxY],
          [minX, midY],
        ],
        roughOptions
      );
      break;
    }

    case "ellipse": {
      const minX = Math.min(element.x, element.x + element.width);
      const maxX = Math.max(element.x, element.x + element.width);
      const minY = Math.min(element.y, element.y + element.height);
      const maxY = Math.max(element.y, element.y + element.height);
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      const w = maxX - minX;
      const h = maxY - minY;

      rc.ellipse(cx, cy, w, h, roughOptions);
      break;
    }

    case "line": {
      const x1 = element.x;
      const y1 = element.y;
      const x2 = element.x + element.width;
      const y2 = element.y + element.height;
      rc.line(x1, y1, x2, y2, roughOptions);
      break;
    }

    case "arrow": {
      const x1 = element.x;
      const y1 = element.y;
      const x2 = element.x + element.width;
      const y2 = element.y + element.height;

      // Draw main line
      rc.line(x1, y1, x2, y2, roughOptions);

      // Arrow head
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const lineLen = Math.hypot(x2 - x1, y2 - y1);
      const headLength = Math.min(lineLen * 0.45, Math.max(12, 10 + element.strokeWidth * 2));
      const arrowAngle = Math.PI / 6;

      const ax1 = x2 - headLength * Math.cos(angle - arrowAngle);
      const ay1 = y2 - headLength * Math.sin(angle - arrowAngle);
      const ax2 = x2 - headLength * Math.cos(angle + arrowAngle);
      const ay2 = y2 - headLength * Math.sin(angle + arrowAngle);

      rc.line(x2, y2, ax1, ay1, roughOptions);
      rc.line(x2, y2, ax2, ay2, roughOptions);
      break;
    }

    case "pencil": {
      if (!element.points || element.points.length === 0) break;
      if (element.points.length === 1) {
        ctx.fillStyle = resolvedStroke;
        ctx.beginPath();
        ctx.arc(element.points[0].x, element.points[0].y, element.strokeWidth / 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      const rawPoints = element.points.map((p) => [p.x, p.y] as [number, number]);
      const strokePoints = getStroke(rawPoints, {
        size: element.strokeWidth * 2.5,
        thinning: 0.5,
        smoothing: 0.6,
        streamline: 0.5,
        easing: (t) => t,
        start: { taper: 2, cap: true },
        end: { taper: 2, cap: true },
      });

      const pathData = getSvgPathFromStroke(strokePoints);
      const p2d = new Path2D(pathData);
      ctx.fillStyle = resolvedStroke;
      ctx.fill(p2d);
      break;
    }

    case "text": {
      const lines = (element.text || "").split("\n");
      const fontSize = element.fontSize || 20;
      const lineHeight = fontSize * 1.35;
      ctx.font = `${fontSize}px ${element.fontFamily || "Caveat, cursive, sans-serif"}`;
      ctx.fillStyle = resolvedStroke;
      ctx.textBaseline = "top";

      const align = element.textAlign || "left";
      ctx.textAlign = align;

      let drawX = element.x;
      if (align === "center") {
        drawX = element.x + element.width / 2;
      } else if (align === "right") {
        drawX = element.x + element.width;
      }

      lines.forEach((line, index) => {
        ctx.fillText(line, drawX, element.y + index * lineHeight);
      });
      break;
    }

    case "image": {
      const x = Math.min(element.x, element.x + element.width);
      const y = Math.min(element.y, element.y + element.height);
      const w = Math.abs(element.width);
      const h = Math.abs(element.height);

      const img = getCachedImage(element.src);
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, x, y, w, h);
      } else {
        ctx.save();
        ctx.fillStyle = isDark ? "rgba(129, 140, 248, 0.1)" : "rgba(99, 102, 241, 0.06)";
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = isDark ? "rgba(165, 180, 252, 0.4)" : "rgba(99, 102, 241, 0.35)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(x, y, w, h);
        ctx.restore();
      }
      break;
    }

    case "frame": {
      const x = Math.min(element.x, element.x + element.width);
      const y = Math.min(element.y, element.y + element.height);
      const w = Math.abs(element.width);
      const h = Math.abs(element.height);

      ctx.save();
      // Optional subtle fill
      if (element.fillStyle !== "none" && element.fillColor && element.fillColor !== "transparent") {
        ctx.fillStyle = resolvedFill || element.fillColor;
        ctx.fillRect(x, y, w, h);
      }

      // Frame dashed/solid container border
      ctx.strokeStyle = resolvedStroke || (isDark ? "#94a3b8" : "#94a3b8");
      ctx.lineWidth = element.strokeWidth || 1.5;
      if (element.strokeStyle === "dashed") {
        ctx.setLineDash([8, 8]);
      } else if (element.strokeStyle === "dotted") {
        ctx.setLineDash([3, 4]);
      } else {
        ctx.setLineDash([6, 6]); // Default frame border is stylish dashed
      }
      ctx.strokeRect(x, y, w, h);

      // Frame top-left title tag
      const frameName = element.name || "Marco";
      ctx.setLineDash([]);
      ctx.font = "bold 11px sans-serif";
      const textWidth = ctx.measureText(frameName).width;
      const tagH = 20;
      const tagW = Math.max(50, textWidth + 16);
      const tagY = y - tagH;

      ctx.fillStyle = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(148, 163, 184, 0.16)";
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(x, tagY, tagW, tagH, [4, 4, 0, 0]);
        ctx.fill();
        ctx.strokeStyle = resolvedStroke || (isDark ? "#64748b" : "#94a3b8");
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        ctx.fillRect(x, tagY, tagW, tagH);
        ctx.strokeRect(x, tagY, tagW, tagH);
      }

      ctx.fillStyle = resolvedStroke || (isDark ? "#cbd5e1" : "#64748b");
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.fillText(frameName, x + 8, tagY + tagH / 2);

      ctx.restore();
      break;
    }

    case "embed": {
      const x = Math.min(element.x, element.x + element.width);
      const y = Math.min(element.y, element.y + element.height);
      const w = Math.abs(element.width);
      const h = Math.abs(element.height);

      ctx.save();
      const radius = 10;
      // Main Card background
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(x, y, w, h, radius);
      } else {
        ctx.rect(x, y, w, h);
      }
      ctx.fillStyle = isDark
        ? (element.fillColor && element.fillColor !== "transparent" ? resolvedFill || element.fillColor : "#1e1e24")
        : (element.fillColor && element.fillColor !== "transparent" ? resolvedFill || element.fillColor : "#ffffff");
      ctx.fill();
      ctx.strokeStyle = isDark ? "#3f3f46" : (resolvedStroke || "#6366f1");
      ctx.lineWidth = element.strokeWidth || 1.5;
      ctx.stroke();

      // Top Browser Header Bar
      const headerHeight = Math.min(32, Math.max(22, h * 0.22));
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(x, y, w, headerHeight, [radius, radius, 0, 0]);
      } else {
        ctx.rect(x, y, w, headerHeight);
      }
      ctx.fillStyle = isDark ? "rgba(99, 102, 241, 0.16)" : "rgba(99, 102, 241, 0.08)";
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x, y + headerHeight);
      ctx.lineTo(x + w, y + headerHeight);
      ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(99, 102, 241, 0.2)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Window controls (Red, Amber, Green dots)
      const dotY = y + headerHeight / 2;
      const dotR = Math.min(3.5, headerHeight * 0.16);
      const dotColors = ["#ef4444", "#f59e0b", "#10b981"];
      dotColors.forEach((color, i) => {
        ctx.beginPath();
        ctx.arc(x + 12 + i * (dotR * 2 + 5), dotY, dotR, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      });

      // Domain extraction
      let displayDomain = "";
      try {
        const parsed = new URL(element.url.startsWith("http") ? element.url : `https://${element.url}`);
        displayDomain = parsed.hostname;
      } catch {
        displayDomain = element.url || "enlace web";
      }

      // Title & URL Content
      const contentCenterY = y + headerHeight + (h - headerHeight) / 2;
      const displayTitle = element.title || displayDomain;

      ctx.fillStyle = isDark ? "#f8f9fa" : "#1e293b";
      const titleSize = Math.max(12, Math.min(16, h * 0.1));
      ctx.font = `bold ${titleSize}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(displayTitle, x + w / 2, contentCenterY - 10);

      ctx.fillStyle = isDark ? "#a5b4fc" : "#6366f1";
      const urlSize = Math.max(10, Math.min(13, h * 0.08));
      ctx.font = `${urlSize}px sans-serif`;
      const truncatedUrl = element.url.length > 35 ? element.url.substring(0, 32) + "..." : element.url;
      ctx.fillText(truncatedUrl, x + w / 2, contentCenterY + 12);

      ctx.restore();
      break;
    }
  }

  ctx.restore();
}

export function drawSelectionBox(
  ctx: CanvasRenderingContext2D,
  bounds: { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number },
  isSingleSelect: boolean = false,
  selectedElement?: TrazzoElement,
  zoom: number = 1,
  isDark: boolean = false
) {
  ctx.save();
  const scale = 1 / Math.max(0.1, Math.min(10, zoom));
  const primaryColor = isDark ? "#818cf8" : "#6366f1";
  const handleBg = isDark ? "#1e1e24" : "#ffffff";
  const handleBorder = isDark ? "#a5b4fc" : "#6366f1";

  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 1.5 * scale;

  if (isSingleSelect && selectedElement && (selectedElement.type === "line" || selectedElement.type === "arrow")) {
    ctx.setLineDash([5 * scale, 4 * scale]);
    ctx.beginPath();
    ctx.moveTo(selectedElement.x, selectedElement.y);
    ctx.lineTo(selectedElement.x + selectedElement.width, selectedElement.y + selectedElement.height);
    ctx.stroke();

    ctx.setLineDash([]);
    const handleRadius = 4.5 * scale;
    const handles = [
      { x: selectedElement.x, y: selectedElement.y },
      { x: selectedElement.x + selectedElement.width, y: selectedElement.y + selectedElement.height },
    ];

    for (const h of handles) {
      ctx.beginPath();
      ctx.arc(h.x, h.y, handleRadius, 0, Math.PI * 2);
      ctx.fillStyle = handleBg;
      ctx.fill();
      ctx.strokeStyle = handleBorder;
      ctx.lineWidth = 1.5 * scale;
      ctx.stroke();
    }

    ctx.restore();
    return;
  }

  // Bounding box border with scale-invariant padding & dash
  const pad = 4 * scale;
  ctx.setLineDash([5 * scale, 4 * scale]);
  ctx.strokeRect(bounds.minX - pad, bounds.minY - pad, bounds.width + pad * 2, bounds.height + pad * 2);

  if (isSingleSelect) {
    ctx.setLineDash([]);

    const midX = (bounds.minX + bounds.maxX) / 2;
    const topY = bounds.minY - pad;
    const stemOffset = 18 * scale;
    const handleRadius = 4.5 * scale;

    // Subtle rotation handle stem
    ctx.beginPath();
    ctx.moveTo(midX, topY);
    ctx.lineTo(midX, topY - stemOffset);
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 1.5 * scale;
    ctx.stroke();

    // Rotation circular handle
    ctx.beginPath();
    ctx.arc(midX, topY - stemOffset, handleRadius, 0, Math.PI * 2);
    ctx.fillStyle = handleBg;
    ctx.fill();
    ctx.strokeStyle = handleBorder;
    ctx.lineWidth = 1.5 * scale;
    ctx.stroke();

    const handles = [
      { x: bounds.minX - pad, y: bounds.minY - pad },
      { x: (bounds.minX + bounds.maxX) / 2, y: bounds.minY - pad },
      { x: bounds.maxX + pad, y: bounds.minY - pad },
      { x: bounds.maxX + pad, y: (bounds.minY + bounds.maxY) / 2 },
      { x: bounds.maxX + pad, y: bounds.maxY + pad },
      { x: (bounds.minX + bounds.maxX) / 2, y: bounds.maxY + pad },
      { x: bounds.minX - pad, y: bounds.maxY + pad },
      { x: bounds.minX - pad, y: (bounds.minY + bounds.maxY) / 2 },
    ];

    for (const h of handles) {
      ctx.beginPath();
      ctx.arc(h.x, h.y, handleRadius, 0, Math.PI * 2);
      ctx.fillStyle = handleBg;
      ctx.fill();
      ctx.strokeStyle = handleBorder;
      ctx.lineWidth = 1.5 * scale;
      ctx.stroke();
    }
  }

  ctx.restore();
}

export function drawMarquee(
  ctx: CanvasRenderingContext2D,
  box: { x1: number; y1: number; x2: number; y2: number },
  isDark: boolean = false
) {
  ctx.save();
  const minX = Math.min(box.x1, box.x2);
  const minY = Math.min(box.y1, box.y2);
  const w = Math.abs(box.x2 - box.x1);
  const h = Math.abs(box.y2 - box.y1);

  ctx.fillStyle = isDark ? "rgba(129, 140, 248, 0.12)" : "rgba(99, 102, 241, 0.08)";
  ctx.fillRect(minX, minY, w, h);

  ctx.strokeStyle = isDark ? "#818cf8" : "#6366f1";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.strokeRect(minX, minY, w, h);

  ctx.restore();
}

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  viewTransform: { x: number; y: number; zoom: number },
  isDark: boolean
) {
  const gridSize = 30 * viewTransform.zoom;
  if (gridSize < 10) return; // don't draw if too small

  const offsetX = ((viewTransform.x % gridSize) + gridSize) % gridSize;
  const offsetY = ((viewTransform.y % gridSize) + gridSize) % gridSize;

  ctx.save();
  ctx.fillStyle = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(100, 116, 139, 0.16)";

  const dotSize = 1.25 * Math.min(1.5, Math.max(0.6, viewTransform.zoom));

  for (let x = offsetX; x < width; x += gridSize) {
    for (let y = offsetY; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.arc(x, y, dotSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}
