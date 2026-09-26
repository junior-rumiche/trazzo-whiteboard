import test from "node:test";
import assert from "node:assert/strict";

// Recreate pure geometry & anchor math
function getElementBounds(element) {
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
    return {
      minX: Math.min(x1, x2),
      minY: Math.min(y1, y2),
      maxX: Math.max(x1, x2),
      maxY: Math.max(y1, y2),
      width: Math.max(1, Math.abs(element.width)),
      height: Math.max(1, Math.abs(element.height)),
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

function getCombinedBounds(elements) {
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

function getAnchorCoordinate(element, anchor) {
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

function getElementAnchors(element) {
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

function findNearestAnchor(point, elements, excludeElementId, snapRadius = 22) {
  let nearest = null;
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

function updateBoundArrows(elements) {
  const elementMap = new Map();
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
    let newStartBinding = el.startBinding;
    let newEndBinding = el.endBinding;

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
      };
    }

    return el;
  });

  return hasChanges ? nextElements : elements;
}

// ----------------------------------------------------
// Tests
// ----------------------------------------------------

test("Smart Connectors - Calculates 5 cardinal anchors (N, S, E, W, Center) for standard shapes", () => {
  const rect = {
    id: "rect_1",
    type: "rectangle",
    x: 100,
    y: 100,
    width: 200,
    height: 100,
  };

  const anchors = getElementAnchors(rect);
  assert.equal(anchors.length, 5);

  const anchorMap = new Map(anchors.map((a) => [a.anchor, a]));
  assert.deepEqual(anchorMap.get("n"), { elementId: "rect_1", anchor: "n", x: 200, y: 100 });
  assert.deepEqual(anchorMap.get("s"), { elementId: "rect_1", anchor: "s", x: 200, y: 200 });
  assert.deepEqual(anchorMap.get("w"), { elementId: "rect_1", anchor: "w", x: 100, y: 150 });
  assert.deepEqual(anchorMap.get("e"), { elementId: "rect_1", anchor: "e", x: 300, y: 150 });
  assert.deepEqual(anchorMap.get("center"), { elementId: "rect_1", anchor: "center", x: 200, y: 150 });
});

test("Smart Connectors - Inverted coordinate bounds still produce correct anchor positions", () => {
  const invertedRect = {
    id: "rect_inv",
    type: "rectangle",
    x: 300,
    y: 200,
    width: -200,
    height: -100,
  };

  const anchors = getElementAnchors(invertedRect);
  const anchorMap = new Map(anchors.map((a) => [a.anchor, a]));

  assert.equal(anchorMap.get("n").y, 100);
  assert.equal(anchorMap.get("s").y, 200);
  assert.equal(anchorMap.get("w").x, 100);
  assert.equal(anchorMap.get("e").x, 300);
  assert.equal(anchorMap.get("center").x, 200);
  assert.equal(anchorMap.get("center").y, 150);
});

test("Smart Connectors - Line and Arrow elements have no anchors (prevents recursive connectors)", () => {
  const arrow = { id: "arr_1", type: "arrow", x: 10, y: 10, width: 50, height: 50 };
  const line = { id: "line_1", type: "line", x: 10, y: 10, width: 50, height: 50 };

  assert.equal(getElementAnchors(arrow).length, 0);
  assert.equal(getElementAnchors(line).length, 0);
});

test("Smart Connectors - Nearest anchor detection with snap threshold", () => {
  const shapes = [
    { id: "box_a", type: "rectangle", x: 100, y: 100, width: 100, height: 100 },
  ];

  // North anchor is at (150, 100)
  // Point close to north anchor within 20px
  const hit = findNearestAnchor({ x: 152, y: 103 }, shapes, undefined, 20);
  assert.ok(hit !== null);
  assert.equal(hit.elementId, "box_a");
  assert.equal(hit.anchor, "n");

  // Point too far from any anchor
  const miss = findNearestAnchor({ x: 50, y: 50 }, shapes, undefined, 20);
  assert.equal(miss, null);

  // Excluded element is skipped
  const excluded = findNearestAnchor({ x: 152, y: 103 }, shapes, "box_a", 20);
  assert.equal(excluded, null);
});

test("Smart Connectors - updateBoundArrows updates endpoints when connected shape is moved", () => {
  const shapeA = { id: "shape_a", type: "rectangle", x: 100, y: 100, width: 100, height: 100 };
  const shapeB = { id: "shape_b", type: "rectangle", x: 400, y: 100, width: 100, height: 100 };

  // Shape A east anchor: (200, 150). Shape B west anchor: (400, 150).
  const arrow = {
    id: "arrow_1",
    type: "arrow",
    x: 200,
    y: 150,
    width: 200,
    height: 0,
    startBinding: { elementId: "shape_a", anchor: "e" },
    endBinding: { elementId: "shape_b", anchor: "w" },
  };

  // Move Shape A down by 50px (x: 100, y: 150)
  const movedShapeA = { ...shapeA, y: 150 };
  const updated = updateBoundArrows([movedShapeA, shapeB, arrow]);

  const updatedArrow = updated.find((el) => el.id === "arrow_1");
  assert.ok(updatedArrow);

  // Shape A east anchor is now at (200, 200)
  assert.equal(updatedArrow.x, 200);
  assert.equal(updatedArrow.y, 200);

  // Target Shape B remained at (400, 150)
  // width: 400 - 200 = 200, height: 150 - 200 = -50
  assert.equal(updatedArrow.width, 200);
  assert.equal(updatedArrow.height, -50);
});

test("Smart Connectors - updateBoundArrows updates endpoints when shape is resized", () => {
  const shape = { id: "shape_1", type: "ellipse", x: 100, y: 100, width: 100, height: 100 };
  const arrow = {
    id: "arrow_1",
    type: "arrow",
    x: 150,
    y: 200,
    width: 0,
    height: 100,
    startBinding: { elementId: "shape_1", anchor: "s" },
    endBinding: null,
  };

  // Resize shape height from 100 to 200 (maxY is now 300, south anchor at y: 300)
  const resizedShape = { ...shape, height: 200 };
  const updated = updateBoundArrows([resizedShape, arrow]);

  const updatedArrow = updated.find((el) => el.id === "arrow_1");
  assert.equal(updatedArrow.y, 300);
  // Endpoint preserves its original absolute position (x: 150, y: 300), so height becomes 0
  assert.equal(updatedArrow.height, 0);
});

test("Smart Connectors - Bound arrow unbinds gracefully when connected element is deleted", () => {
  const shapeA = { id: "shape_a", type: "rectangle", x: 100, y: 100, width: 100, height: 100 };
  const arrow = {
    id: "arrow_1",
    type: "arrow",
    x: 200,
    y: 150,
    width: 100,
    height: 0,
    startBinding: { elementId: "shape_a", anchor: "e" },
    endBinding: { elementId: "non_existent", anchor: "w" },
  };

  const updated = updateBoundArrows([shapeA, arrow]);
  const updatedArrow = updated.find((el) => el.id === "arrow_1");

  // startBinding preserved since shapeA exists
  assert.deepEqual(updatedArrow.startBinding, { elementId: "shape_a", anchor: "e" });
  // endBinding removed because target doesn't exist
  assert.equal(updatedArrow.endBinding, null);
});

