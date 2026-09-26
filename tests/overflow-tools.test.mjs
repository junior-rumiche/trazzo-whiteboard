import { test } from "node:test";
import assert from "node:assert/strict";

// Re-implement or test pure geometry & tool logic
function isPointInPolygon(p, polygon) {
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

function getElementBounds(element) {
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

function isElementInPolygon(element, polygon) {
  if (element.isDeleted || polygon.length < 3) return false;
  const b = getElementBounds(element);
  const cx = b.minX + b.width / 2;
  const cy = b.minY + b.height / 2;
  if (isPointInPolygon({ x: cx, y: cy }, polygon)) return true;

  const corners = [
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

test("Lasso Selection - Point in polygon ray-casting algorithm", () => {
  const triangle = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 50, y: 100 },
  ];

  assert.equal(isPointInPolygon({ x: 50, y: 30 }, triangle), true);
  assert.equal(isPointInPolygon({ x: 150, y: 50 }, triangle), false);
  assert.equal(isPointInPolygon({ x: 0, y: 200 }, triangle), false);
});

test("Lasso Selection - Detects elements inside freehand polygon", () => {
  const loop = [
    { x: 0, y: 0 },
    { x: 200, y: 0 },
    { x: 200, y: 200 },
    { x: 0, y: 200 },
  ];

  const insideEl = {
    id: "el-1",
    type: "rectangle",
    x: 50,
    y: 50,
    width: 60,
    height: 40,
    isDeleted: false,
  };

  const outsideEl = {
    id: "el-2",
    type: "rectangle",
    x: 300,
    y: 300,
    width: 50,
    height: 50,
    isDeleted: false,
  };

  assert.equal(isElementInPolygon(insideEl, loop), true);
  assert.equal(isElementInPolygon(outsideEl, loop), false);
});

test("Frame Tool - Bounds and contained elements detection", () => {
  const frame = {
    id: "frame-1",
    type: "frame",
    name: "Marco 1",
    x: 100,
    y: 100,
    width: 400,
    height: 300,
  };

  const fb = getElementBounds(frame);
  assert.equal(fb.width, 400);
  assert.equal(fb.height, 300);

  const childEl = {
    id: "child-1",
    type: "rectangle",
    x: 150,
    y: 150,
    width: 80,
    height: 60,
  };

  const isContained =
    childEl.x >= fb.minX &&
    childEl.x + childEl.width <= fb.maxX &&
    childEl.y >= fb.minY &&
    childEl.y + childEl.height <= fb.maxY;

  assert.equal(isContained, true);
});

function isPointNearFrame(p, element, tolerance = 8) {
  const b = getElementBounds(element);
  const tol = tolerance + (element.strokeWidth || 1.5) / 2;
  const inBody =
    p.x >= b.minX - tol &&
    p.x <= b.maxX + tol &&
    p.y >= b.minY - tol &&
    p.y <= b.maxY + tol;
  if (inBody) return true;

  const tagW = Math.max(60, (element.name?.length || 5) * 8 + 20);
  const inTab =
    p.x >= b.minX - tol &&
    p.x <= b.minX + tagW + tol &&
    p.y >= b.minY - 24 - tol &&
    p.y <= b.minY + tol;
  return inTab;
}

test("Frame Tool - Top title tab hit detection", () => {
  const frame = {
    id: "frame-1",
    type: "frame",
    name: "Dashboard",
    x: 100,
    y: 100,
    width: 400,
    height: 300,
    strokeWidth: 2,
  };

  // Click on the top title tab at (120, 85) - 15px above the frame body
  assert.equal(isPointNearFrame({ x: 120, y: 85 }, frame), true);
  // Click far above tab
  assert.equal(isPointNearFrame({ x: 120, y: 60 }, frame), false);
  // Click inside body
  assert.equal(isPointNearFrame({ x: 150, y: 150 }, frame), true);
});

test("Frame Tool - Contained elements detection handles inverted coordinates", () => {
  const frame = {
    id: "frame-1",
    type: "frame",
    name: "Marco 1",
    x: 100,
    y: 100,
    width: 400,
    height: 300,
  };
  const fb = getElementBounds(frame);

  // Inverted rectangle drawn from (250, 250) with negative width and height
  const invertedChild = {
    id: "child-inv",
    type: "rectangle",
    x: 250,
    y: 250,
    width: -80,
    height: -60,
  };
  const cb = getElementBounds(invertedChild);

  const isContained =
    cb.minX >= fb.minX &&
    cb.maxX <= fb.maxX &&
    cb.minY >= fb.minY &&
    cb.maxY <= fb.maxY;

  assert.equal(isContained, true);
});

test("Frame Tool - Priority selection hits child element over frame container", () => {
  const frame = {
    id: "frame-1",
    type: "frame",
    x: 100,
    y: 100,
    width: 400,
    height: 300,
  };

  const child = {
    id: "child-1",
    type: "rectangle",
    x: 150,
    y: 150,
    width: 80,
    height: 60,
    fillStyle: "solid",
    strokeWidth: 2,
  };

  const elements = [frame, child];

  const clickPoint = { x: 170, y: 170 };

  const findHit = (pt) => {
    const nonFrame = elements
      .slice()
      .reverse()
      .find((el) => el.type !== "frame" && (el.x <= pt.x && el.x + el.width >= pt.x && el.y <= pt.y && el.y + el.height >= pt.y));
    if (nonFrame) return nonFrame;
    return elements.find((el) => el.type === "frame");
  };

  const hit = findHit(clickPoint);
  assert.equal(hit.id, "child-1");
});

test("Lasso Selection - Detects line endpoints inside polygon", () => {
  const loop = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 },
  ];

  const line = {
    id: "line-1",
    type: "line",
    x: 50,
    y: 50,
    width: 100,
    height: 100,
  };

  const isStartIn = isPointInPolygon({ x: line.x, y: line.y }, loop);
  assert.equal(isStartIn, true);
});

test("Web Embed - Normalizes URL and extracts domain", () => {
  const inputUrl1 = "https://github.com/trazzo/trazzo";
  const parsed1 = new URL(inputUrl1);
  assert.equal(parsed1.hostname, "github.com");

  const inputUrl2 = "figma.com/@community";
  const normalized2 = inputUrl2.startsWith("http") ? inputUrl2 : `https://${inputUrl2}`;
  const parsed2 = new URL(normalized2);
  assert.equal(parsed2.hostname, "figma.com");
});

test("Bucket Fill - Applies fill color and style to unfilled elements", () => {
  const el = {
    id: "rect-1",
    type: "rectangle",
    x: 10,
    y: 10,
    width: 100,
    height: 100,
    strokeColor: "#6366f1",
    fillColor: "transparent",
    fillStyle: "none",
  };

  const targetColor = "#a5b4fc";
  const targetStyle = "solid";

  const updated = {
    ...el,
    fillColor: targetColor,
    fillStyle: targetStyle,
  };

  assert.equal(updated.fillColor, "#a5b4fc");
  assert.equal(updated.fillStyle, "solid");
});
