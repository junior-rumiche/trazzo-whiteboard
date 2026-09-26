import { Point, TrazzoElement, ResizeHandle, AnchorPosition, PointBinding } from "../types/canvas";

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export function getElementBounds(element: TrazzoElement): Bounds {
  if (element.type === "pencil") {
    if (!element.points || element.points.length === 0) {
      return {
        minX: element.x,
        minY: element.y,
        maxX: element.x + element.width,
        maxY: element.y + element.height,
        width: Math.abs(element.width),
        height: Math.abs(element.height),
      };
    }
    const xs = element.points.map((p) => p.x);
    const ys = element.points.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return {
      minX,
      minY,
      maxX,
      maxY,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY),
    };
  }

  if (element.type === "line" || element.type === "arrow") {
    const x1 = element.x;
    const y1 = element.y;
    const x2 = element.x + element.width;
    const y2 = element.y + element.height;
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    return {
      minX,
      minY,
      maxX,
      maxY,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY),
    };
  }

  const minX = Math.min(element.x, element.x + element.width);
  const maxX = Math.max(element.x, element.x + element.width);
  const minY = Math.min(element.y, element.y + element.height);
  const maxY = Math.max(element.y, element.y + element.height);

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function getCombinedBounds(elements: TrazzoElement[]): Bounds | null {
  if (elements.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const el of elements) {
    if (el.isDeleted) continue;
    const b = getElementBounds(el);
    minX = Math.min(minX, b.minX);
    minY = Math.min(minY, b.minY);
    maxX = Math.max(maxX, b.maxX);
    maxY = Math.max(maxY, b.maxY);
  }

  if (minX === Infinity) return null;

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

function distanceToSegment(p: Point, a: Point, b: Point): number {
  const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * (b.x - a.x)), p.y - (a.y + t * (b.y - a.y)));
}

export function isPointNearElement(p: Point, element: TrazzoElement, tolerance: number = 8): boolean {
  if (element.isDeleted) return false;
  const tol = tolerance + element.strokeWidth / 2;

  switch (element.type) {
    case "rectangle": {
      const b = getElementBounds(element);
      // If filled, clicking inside counts
      if (element.fillStyle !== "none") {
        return (
          p.x >= b.minX - tol &&
          p.x <= b.maxX + tol &&
          p.y >= b.minY - tol &&
          p.y <= b.maxY + tol
        );
      }
      // If unfilled, check proximity to any of the 4 borders
      const tl = { x: b.minX, y: b.minY };
      const tr = { x: b.maxX, y: b.minY };
      const br = { x: b.maxX, y: b.maxY };
      const bl = { x: b.minX, y: b.maxY };

      return (
        distanceToSegment(p, tl, tr) <= tol ||
        distanceToSegment(p, tr, br) <= tol ||
        distanceToSegment(p, br, bl) <= tol ||
        distanceToSegment(p, bl, tl) <= tol
      );
    }

    case "text":
    case "image":
    case "embed": {
      const b = getElementBounds(element);
      return (
        p.x >= b.minX - tol &&
        p.x <= b.maxX + tol &&
        p.y >= b.minY - tol &&
        p.y <= b.maxY + tol
      );
    }

    case "frame": {
      const b = getElementBounds(element);
      const inBody =
        p.x >= b.minX - tol &&
        p.x <= b.maxX + tol &&
        p.y >= b.minY - tol &&
        p.y <= b.maxY + tol;
      if (inBody) return true;

      // Top title tab: y from minY - 24 to minY, x from minX to minX + tagW
      const tagW = Math.max(60, ((element as any).name?.length || 5) * 8 + 20);
      const inTab =
        p.x >= b.minX - tol &&
        p.x <= b.minX + tagW + tol &&
        p.y >= b.minY - 24 - tol &&
        p.y <= b.minY + tol;
      return inTab;
    }

    case "diamond": {
      const b = getElementBounds(element);
      const cx = (b.minX + b.maxX) / 2;
      const cy = (b.minY + b.maxY) / 2;
      const rx = b.width / 2;
      const ry = b.height / 2;
      if (rx <= 0 || ry <= 0) return false;

      const top = { x: cx, y: b.minY };
      const right = { x: b.maxX, y: cy };
      const bottom = { x: cx, y: b.maxY };
      const left = { x: b.minX, y: cy };

      if (element.fillStyle !== "none") {
        // Inside diamond check
        const normDist = Math.abs(p.x - cx) / rx + Math.abs(p.y - cy) / ry;
        return normDist <= 1 + tol / Math.min(rx, ry);
      }

      return (
        distanceToSegment(p, top, right) <= tol ||
        distanceToSegment(p, right, bottom) <= tol ||
        distanceToSegment(p, bottom, left) <= tol ||
        distanceToSegment(p, left, top) <= tol
      );
    }

    case "ellipse": {
      const b = getElementBounds(element);
      const cx = (b.minX + b.maxX) / 2;
      const cy = (b.minY + b.maxY) / 2;
      const rx = b.width / 2;
      const ry = b.height / 2;
      if (rx <= 0 || ry <= 0) return false;

      if (element.fillStyle !== "none") {
        const norm = ((p.x - cx) / (rx + tol)) ** 2 + ((p.y - cy) / (ry + tol)) ** 2;
        return norm <= 1;
      }

      // Unfilled ellipse: distance to closest boundary point
      const angle = Math.atan2(p.y - cy, p.x - cx);
      const ex = cx + rx * Math.cos(angle);
      const ey = cy + ry * Math.sin(angle);
      return Math.hypot(p.x - ex, p.y - ey) <= tol;
    }

    case "line":
    case "arrow": {
      const p1 = { x: element.x, y: element.y };
      const p2 = { x: element.x + element.width, y: element.y + element.height };
      return distanceToSegment(p, p1, p2) <= tol;
    }

    case "pencil": {
      if (!element.points || element.points.length === 0) return false;
      if (element.points.length === 1) {
        return Math.hypot(p.x - element.points[0].x, p.y - element.points[0].y) <= tol;
      }
      for (let i = 0; i < element.points.length - 1; i++) {
        if (distanceToSegment(p, element.points[i], element.points[i + 1]) <= tol) {
          return true;
        }
      }
      return false;
    }

    default:
      return false;
  }
}

export function isElementInBox(
  element: TrazzoElement,
  box: { x1: number; y1: number; x2: number; y2: number }
): boolean {
  if (element.isDeleted) return false;
  const b = getElementBounds(element);
  const minX = Math.min(box.x1, box.x2);
  const maxX = Math.max(box.x1, box.x2);
  const minY = Math.min(box.y1, box.y2);
  const maxY = Math.max(box.y1, box.y2);

  // Check if bounding box intersects or is contained
  return (
    b.minX <= maxX &&
    b.maxX >= minX &&
    b.minY <= maxY &&
    b.maxY >= minY
  );
}

export interface HandlePosition {
  handle: ResizeHandle;
  x: number;
  y: number;
}

export const SELECTION_BOX_PADDING = 4;

export function getElementHandles(element: TrazzoElement): HandlePosition[] {
  if (element.type === "line" || element.type === "arrow") {
    return [
      { handle: "start", x: element.x, y: element.y },
      { handle: "end", x: element.x + element.width, y: element.y + element.height },
    ];
  }

  const b = getElementBounds(element);
  const pad = SELECTION_BOX_PADDING;
  const minX = b.minX - pad;
  const maxX = b.maxX + pad;
  const minY = b.minY - pad;
  const maxY = b.maxY + pad;
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;

  return [
    { handle: "nw", x: minX, y: minY },
    { handle: "n", x: midX, y: minY },
    { handle: "ne", x: maxX, y: minY },
    { handle: "e", x: maxX, y: midY },
    { handle: "se", x: maxX, y: maxY },
    { handle: "s", x: midX, y: maxY },
    { handle: "sw", x: minX, y: maxY },
    { handle: "w", x: minX, y: midY },
  ];
}

export function getHandleAtPosition(
  p: Point,
  element: TrazzoElement,
  tolerance: number = 8
): ResizeHandle | null {
  const handles = getElementHandles(element);
  for (const h of handles) {
    if (Math.hypot(p.x - h.x, p.y - h.y) <= tolerance) {
      return h.handle;
    }
  }
  return null;
}

export interface AnchorPoint {
  elementId: string;
  anchor: AnchorPosition;
  x: number;
  y: number;
}

export function getAnchorCoordinate(element: TrazzoElement, anchor: AnchorPosition): Point {
  const b = getElementBounds(element);
  const midX = b.minX + b.width / 2;
  const midY = b.minY + b.height / 2;

  switch (anchor) {
    case "n":
      return { x: midX, y: b.minY };
    case "s":
      return { x: midX, y: b.maxY };
    case "w":
      return { x: b.minX, y: midY };
    case "e":
      return { x: b.maxX, y: midY };
    case "center":
    default:
      return { x: midX, y: midY };
  }
}

export function getElementAnchors(element: TrazzoElement): AnchorPoint[] {
  if (element.isDeleted || element.type === "line" || element.type === "arrow") {
    return [];
  }

  const b = getElementBounds(element);
  const midX = b.minX + b.width / 2;
  const midY = b.minY + b.height / 2;

  return [
    { elementId: element.id, anchor: "n", x: midX, y: b.minY },
    { elementId: element.id, anchor: "s", x: midX, y: b.maxY },
    { elementId: element.id, anchor: "w", x: b.minX, y: midY },
    { elementId: element.id, anchor: "e", x: b.maxX, y: midY },
    { elementId: element.id, anchor: "center", x: midX, y: midY },
  ];
}

export function findNearestAnchor(
  point: Point,
  elements: TrazzoElement[],
  excludeElementId?: string,
  snapRadius: number = 22
): AnchorPoint | null {
  let nearest: AnchorPoint | null = null;
  let minDist = snapRadius;

  for (const el of elements) {
    if (el.isDeleted || el.id === excludeElementId || el.type === "line" || el.type === "arrow") {
      continue;
    }

    const anchors = getElementAnchors(el);
    for (const a of anchors) {
      const dist = Math.hypot(point.x - a.x, point.y - a.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = a;
      }
    }
  }

  return nearest;
}

export function updateBoundArrows(elements: TrazzoElement[]): TrazzoElement[] {
  const elementMap = new Map<string, TrazzoElement>();
  for (const el of elements) {
    if (!el.isDeleted) {
      elementMap.set(el.id, el);
    }
  }

  let hasChanges = false;
  const nextElements = elements.map((el) => {
    if (el.isDeleted || (el.type !== "line" && el.type !== "arrow")) {
      return el;
    }

    if (!el.startBinding && !el.endBinding) {
      return el;
    }

    let startX = el.x;
    let startY = el.y;
    let endX = el.x + el.width;
    let endY = el.y + el.height;
    let newStartBinding: PointBinding | null | undefined = el.startBinding;
    let newEndBinding: PointBinding | null | undefined = el.endBinding;

    if (el.startBinding) {
      const source = elementMap.get(el.startBinding.elementId);
      if (source && !source.isDeleted) {
        const coord = getAnchorCoordinate(source, el.startBinding.anchor);
        startX = coord.x;
        startY = coord.y;
      } else {
        newStartBinding = null;
      }
    }

    if (el.endBinding) {
      const target = elementMap.get(el.endBinding.elementId);
      if (target && !target.isDeleted) {
        const coord = getAnchorCoordinate(target, el.endBinding.anchor);
        endX = coord.x;
        endY = coord.y;
      } else {
        newEndBinding = null;
      }
    }

    const nextWidth = endX - startX;
    const nextHeight = endY - startY;

    if (
      el.x !== startX ||
      el.y !== startY ||
      el.width !== nextWidth ||
      el.height !== nextHeight ||
      el.startBinding !== newStartBinding ||
      el.endBinding !== newEndBinding
    ) {
      hasChanges = true;
      return {
        ...el,
        x: startX,
        y: startY,
        width: nextWidth,
        height: nextHeight,
        startBinding: newStartBinding,
        endBinding: newEndBinding,
      } as TrazzoElement;
    }

    return el;
  });

  return hasChanges ? nextElements : elements;
}

export function isPointInPolygon(p: Point, polygon: Point[]): boolean {
  if (polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x,
      yi = polygon[i].y;
    const xj = polygon[j].x,
      yj = polygon[j].y;
    const intersect =
      yi > p.y !== yj > p.y && p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function isElementInPolygon(element: TrazzoElement, polygon: Point[]): boolean {
  if (element.isDeleted || polygon.length < 3) return false;

  if (element.type === "pencil" && element.points && element.points.length > 0) {
    for (const pt of element.points) {
      if (isPointInPolygon(pt, polygon)) return true;
    }
  }

  if (element.type === "line" || element.type === "arrow") {
    if (isPointInPolygon({ x: element.x, y: element.y }, polygon)) return true;
    if (isPointInPolygon({ x: element.x + element.width, y: element.y + element.height }, polygon)) return true;
    if (
      isPointInPolygon(
        { x: element.x + element.width / 2, y: element.y + element.height / 2 },
        polygon
      )
    )
      return true;
  }

  const b = getElementBounds(element);
  const cx = b.minX + b.width / 2;
  const cy = b.minY + b.height / 2;
  if (isPointInPolygon({ x: cx, y: cy }, polygon)) return true;

  const corners: Point[] = [
    { x: b.minX, y: b.minY },
    { x: b.maxX, y: b.minY },
    { x: b.maxX, y: b.maxY },
    { x: b.minX, y: b.maxY },
  ];
  for (const c of corners) {
    if (isPointInPolygon(c, polygon)) return true;
  }

  return false;
}


