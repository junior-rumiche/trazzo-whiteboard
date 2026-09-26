import { test } from "node:test";
import assert from "node:assert/strict";

// Dynamic import of shapeRecognizer or compile-free test
// We can re-implement the pure algorithm or test it directly
function distanceToSegment(p, a, b) {
  const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * (b.x - a.x)), p.y - (a.y + t * (b.y - a.y)));
}

function recognizeShape(points) {
  if (!points || points.length < 5) {
    const p0 = points?.[0] || { x: 0, y: 0 };
    return { type: "pencil", label: "Trazo libre" };
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

  if (width < 12 && height < 12) {
    return { type: "pencil", label: "Trazo libre" };
  }

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
      let ellipseVariance = 0;
      for (const p of points) {
        const norm = ((p.x - cx) / rx) ** 2 + ((p.y - cy) / ry) ** 2;
        ellipseVariance += (norm - 1) ** 2;
      }
      const ellipseMse = ellipseVariance / points.length;

      let diamondVariance = 0;
      for (const p of points) {
        const norm = Math.abs(p.x - cx) / rx + Math.abs(p.y - cy) / ry;
        diamondVariance += (norm - 1) ** 2;
      }
      const diamondMse = diamondVariance / points.length;

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

      let nearTL = false, nearTR = false, nearBR = false, nearBL = false;
      const cornerThreshold = Math.max(16, maxDim * 0.28);
      for (const p of points) {
        if (Math.hypot(p.x - minX, p.y - minY) < cornerThreshold) nearTL = true;
        if (Math.hypot(p.x - maxX, p.y - minY) < cornerThreshold) nearTR = true;
        if (Math.hypot(p.x - maxX, p.y - maxY) < cornerThreshold) nearBR = true;
        if (Math.hypot(p.x - minX, p.y - maxY) < cornerThreshold) nearBL = true;
      }
      const cornersVisited = [nearTL, nearTR, nearBR, nearBL].filter(Boolean).length;

      if (ellipseMse < 0.22 && ellipseMse < rectMse && ellipseMse < diamondMse) {
        return { type: "ellipse", label: "Círculo / Elipse", bounds };
      }
      if (diamondMse < 0.18 && diamondMse < rectMse && cornersVisited <= 2) {
        return { type: "diamond", label: "Rombo", bounds };
      }
      if (cornersVisited >= 3 || rectMse < 0.25) {
        return { type: "rectangle", label: "Rectángulo", bounds };
      }
      if (ellipseMse < 0.35) {
        return { type: "ellipse", label: "Círculo / Elipse", bounds };
      }
    }
  } else {
    let maxLineDev = 0;
    let sumLineDev = 0;
    for (const p of points) {
      const dev = distanceToSegment(p, startPt, endPt);
      if (dev > maxLineDev) maxLineDev = dev;
      sumLineDev += dev;
    }
    const avgLineDev = sumLineDev / points.length;

    let maxDistFromStart = 0;
    let tipIndex = points.length - 1;
    for (let i = 0; i < points.length; i++) {
      const d = Math.hypot(points[i].x - startPt.x, points[i].y - startPt.y);
      if (d > maxDistFromStart) {
        maxDistFromStart = d;
        tipIndex = i;
      }
    }

    const tipRatio = tipIndex / points.length;
    if (tipRatio >= 0.6 && tipRatio <= 0.92 && points.length >= 8) {
      const tipPt = points[tipIndex];
      const lastPt = points[points.length - 1];
      const backDist = Math.hypot(lastPt.x - tipPt.x, lastPt.y - tipPt.y);
      if (backDist > 8 && backDist < maxDistFromStart * 0.6) {
        return { type: "arrow", label: "Flecha Conectora", bounds };
      }
    }

    if (avgLineDev < Math.max(12, directDist * 0.14) && maxLineDev < Math.max(24, directDist * 0.28)) {
      return { type: "line", label: "Línea recta", bounds };
    }
  }

  return { type: "pencil", label: "Trazo libre" };
}

test("Shape Recognizer - detects drawn circle / ellipse", () => {
  const points = [];
  const cx = 100, cy = 100, r = 50;
  for (let a = 0; a <= Math.PI * 2; a += 0.2) {
    // Add small hand tremor
    const jitter = (Math.sin(a * 5) * 2);
    points.push({ x: cx + (r + jitter) * Math.cos(a), y: cy + (r + jitter) * Math.sin(a) });
  }
  const result = recognizeShape(points);
  assert.equal(result.type, "ellipse");
});

test("Shape Recognizer - detects hand-drawn rectangle", () => {
  const points = [];
  // Top edge
  for (let x = 10; x <= 110; x += 10) points.push({ x, y: 20 + Math.sin(x) * 1 });
  // Right edge
  for (let y = 20; y <= 90; y += 10) points.push({ x: 110 + Math.sin(y) * 1, y });
  // Bottom edge
  for (let x = 110; x >= 10; x -= 10) points.push({ x, y: 90 + Math.sin(x) * 1 });
  // Left edge back to top
  for (let y = 90; y >= 20; y -= 10) points.push({ x: 10 + Math.sin(y) * 1, y });

  const result = recognizeShape(points);
  assert.equal(result.type, "rectangle");
});

test("Shape Recognizer - detects straight line", () => {
  const points = [];
  for (let i = 0; i <= 100; i += 5) {
    points.push({ x: i, y: i * 0.5 + (Math.sin(i) * 1) });
  }
  const result = recognizeShape(points);
  assert.equal(result.type, "line");
});

test("Shape Recognizer - detects arrow with barb", () => {
  const points = [];
  // Main shaft 0 to 100
  for (let x = 0; x <= 100; x += 10) points.push({ x, y: 50 });
  // Barb returning at angle
  points.push({ x: 90, y: 40 });
  points.push({ x: 80, y: 35 });

  const result = recognizeShape(points);
  assert.equal(result.type, "arrow");
});

test("Shape Recognizer - detects diamond", () => {
  const points = [];
  // Top to Right (50, 0) -> (100, 50)
  for (let t = 0; t <= 1; t += 0.2) points.push({ x: 50 + t * 50, y: 0 + t * 50 });
  // Right to Bottom (100, 50) -> (50, 100)
  for (let t = 0; t <= 1; t += 0.2) points.push({ x: 100 - t * 50, y: 50 + t * 50 });
  // Bottom to Left (50, 100) -> (0, 50)
  for (let t = 0; t <= 1; t += 0.2) points.push({ x: 50 - t * 50, y: 100 - t * 50 });
  // Left to Top (0, 50) -> (50, 0)
  for (let t = 0; t <= 1; t += 0.2) points.push({ x: 0 + t * 50, y: 50 - t * 50 });

  const result = recognizeShape(points);
  assert.equal(result.type, "diamond");
});

test("Shape Recognizer - fallback to pencil for random squiggle", () => {
  const points = [
    { x: 0, y: 0 },
    { x: 10, y: 40 },
    { x: 50, y: 10 },
    { x: 20, y: 90 },
    { x: 100, y: 20 },
    { x: 40, y: 80 },
    { x: 120, y: 100 },
  ];
  const result = recognizeShape(points);
  assert.equal(result.type, "pencil");
});
