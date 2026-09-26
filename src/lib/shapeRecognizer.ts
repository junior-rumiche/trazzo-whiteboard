import { Point } from "../types/canvas";

export interface RecognizedShape {
  type: "rectangle" | "diamond" | "ellipse" | "arrow" | "line" | "pencil";
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
  };
  startPoint: Point;
  endPoint: Point;
  label: string;
}

function distanceToSegment(p: Point, a: Point, b: Point): number {
  const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * (b.x - a.x)), p.y - (a.y + t * (b.y - a.y)));
}

export function recognizeShape(points: Point[]): RecognizedShape {
  if (!points || points.length < 5) {
    const p0 = points?.[0] || { x: 0, y: 0 };
    return {
      type: "pencil",
      bounds: { minX: p0.x, minY: p0.y, maxX: p0.x, maxY: p0.y, width: 0, height: 0 },
      startPoint: p0,
      endPoint: p0,
      label: "Trazo libre",
    };
  }

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  const bounds = { minX, minY, maxX, maxY, width, height };

  const startPt = points[0];
  const endPt = points[points.length - 1];

  // If stroke is tiny, keep as pencil
  if (width < 12 && height < 12) {
    return {
      type: "pencil",
      bounds,
      startPoint: startPt,
      endPoint: endPt,
      label: "Trazo libre",
    };
  }

  // Calculate total path arc length
  let pathLength = 0;
  for (let i = 1; i < points.length; i++) {
    pathLength += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }

  const directDist = Math.hypot(endPt.x - startPt.x, endPt.y - startPt.y);
  const maxDim = Math.max(width, height);
  const isClosed = directDist / pathLength < 0.32 || directDist < 35 || directDist < maxDim * 0.22;

  if (isClosed) {
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const rx = width / 2;
    const ry = height / 2;

    if (rx > 0 && ry > 0) {
      // 1. Ellipse score
      let ellipseVariance = 0;
      for (const p of points) {
        const norm = ((p.x - cx) / rx) ** 2 + ((p.y - cy) / ry) ** 2;
        ellipseVariance += (norm - 1) ** 2;
      }
      const ellipseMse = ellipseVariance / points.length;

      // 2. Diamond score: Manhattan distance from center normalized
      let diamondVariance = 0;
      for (const p of points) {
        const norm = Math.abs(p.x - cx) / rx + Math.abs(p.y - cy) / ry;
        diamondVariance += (norm - 1) ** 2;
      }
      const diamondMse = diamondVariance / points.length;

      // 3. Rectangle score: points hugging the 4 bounding box edges
      let rectDistSum = 0;
      for (const p of points) {
        const dLeft = Math.abs(p.x - minX);
        const dRight = Math.abs(p.x - maxX);
        const dTop = Math.abs(p.y - minY);
        const dBottom = Math.abs(p.y - maxY);
        const dEdge = Math.min(dLeft, dRight, dTop, dBottom);
        rectDistSum += (dEdge / Math.min(rx, ry)) ** 2;
      }
      const rectMse = rectDistSum / points.length;

      // Check corner occupancy for rectangles
      // In a rectangle, stroke should visit near the 4 corners:
      let nearTL = false, nearTR = false, nearBR = false, nearBL = false;
      const cornerThreshold = Math.max(16, maxDim * 0.28);
      for (const p of points) {
        if (Math.hypot(p.x - minX, p.y - minY) < cornerThreshold) nearTL = true;
        if (Math.hypot(p.x - maxX, p.y - minY) < cornerThreshold) nearTR = true;
        if (Math.hypot(p.x - maxX, p.y - maxY) < cornerThreshold) nearBR = true;
        if (Math.hypot(p.x - minX, p.y - maxY) < cornerThreshold) nearBL = true;
      }
      const cornersVisited = [nearTL, nearTR, nearBR, nearBL].filter(Boolean).length;

      // Classification decision
      if (ellipseMse < 0.22 && ellipseMse < rectMse && ellipseMse < diamondMse) {
        return {
          type: "ellipse",
          bounds,
          startPoint: startPt,
          endPoint: endPt,
          label: "Círculo / Elipse",
        };
      }

      if (diamondMse < 0.18 && diamondMse < rectMse && cornersVisited <= 2) {
        return {
          type: "diamond",
          bounds,
          startPoint: startPt,
          endPoint: endPt,
          label: "Rombo",
        };
      }

      if (cornersVisited >= 3 || rectMse < 0.25) {
        return {
          type: "rectangle",
          bounds,
          startPoint: startPt,
          endPoint: endPt,
          label: "Rectángulo",
        };
      }

      if (ellipseMse < 0.35) {
        return {
          type: "ellipse",
          bounds,
          startPoint: startPt,
          endPoint: endPt,
          label: "Círculo / Elipse",
        };
      }
    }
  } else {
    // Open stroke: check for Line or Arrow
    // 1. Check straight line deviation
    let maxLineDev = 0;
    let sumLineDev = 0;
    for (const p of points) {
      const dev = distanceToSegment(p, startPt, endPt);
      if (dev > maxLineDev) maxLineDev = dev;
      sumLineDev += dev;
    }
    const avgLineDev = sumLineDev / points.length;

    // Check if points form an arrow (look for sharp point/tip followed by barb)
    // Find point farthest from startPoint along the main axis
    let maxDistFromStart = 0;
    let tipIndex = points.length - 1;
    for (let i = 0; i < points.length; i++) {
      const d = Math.hypot(points[i].x - startPt.x, points[i].y - startPt.y);
      if (d > maxDistFromStart) {
        maxDistFromStart = d;
        tipIndex = i;
      }
    }

    // If tip is near 65%-90% of the stroke, and after that points turn back (arrow barb)
    const tipRatio = tipIndex / points.length;
    if (tipRatio >= 0.6 && tipRatio <= 0.92 && points.length >= 8) {
      const tipPt = points[tipIndex];
      // Check if remainder points back towards start
      const lastPt = points[points.length - 1];
      const backDist = Math.hypot(lastPt.x - tipPt.x, lastPt.y - tipPt.y);
      if (backDist > 8 && backDist < maxDistFromStart * 0.6) {
        return {
          type: "arrow",
          bounds,
          startPoint: startPt,
          endPoint: tipPt,
          label: "Flecha Conectora",
        };
      }
    }

    // If straight line
    if (avgLineDev < Math.max(12, directDist * 0.14) && maxLineDev < Math.max(24, directDist * 0.28)) {
      return {
        type: "line",
        bounds,
        startPoint: startPt,
        endPoint: endPt,
        label: "Línea recta",
      };
    }
  }

  // Fallback to smoothed pencil
  return {
    type: "pencil",
    bounds,
    startPoint: startPt,
    endPoint: endPt,
    label: "Trazo libre",
  };
}
