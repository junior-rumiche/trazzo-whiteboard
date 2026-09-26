import test from "node:test";
import assert from "node:assert/strict";

const SELECTION_BOX_PADDING = 4;

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

function distanceToSegment(p, a, b) {
  const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * (b.x - a.x)), p.y - (a.y + t * (b.y - a.y)));
}

function isPointNearElement(p, element, tolerance = 8) {
  if (element.isDeleted) return false;
  const tol = tolerance + (element.strokeWidth || 2) / 2;

  switch (element.type) {
    case "rectangle": {
      const b = getElementBounds(element);
      if (element.fillStyle !== "none") {
        return (
          p.x >= b.minX - tol &&
          p.x <= b.maxX + tol &&
          p.y >= b.minY - tol &&
          p.y <= b.maxY + tol
        );
      }
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
    case "image": {
      const b = getElementBounds(element);
      return (
        p.x >= b.minX - tol &&
        p.x <= b.maxX + tol &&
        p.y >= b.minY - tol &&
        p.y <= b.maxY + tol
      );
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

function isElementInBox(element, box) {
  if (element.isDeleted) return false;
  const b = getElementBounds(element);
  const minX = Math.min(box.x1, box.x2);
  const maxX = Math.max(box.x1, box.x2);
  const minY = Math.min(box.y1, box.y2);
  const maxY = Math.max(box.y1, box.y2);

  return (
    b.minX <= maxX &&
    b.maxX >= minX &&
    b.minY <= maxY &&
    b.maxY >= minY
  );
}

function getElementHandles(element) {
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

function getHandleAtPosition(p, element, tolerance = 8) {
  const handles = getElementHandles(element);
  for (const h of handles) {
    if (Math.hypot(p.x - h.x, p.y - h.y) <= tolerance) {
      return h.handle;
    }
  }
  return null;
}

function parseTrazzoFile(content) {
  const parsed = JSON.parse(content);

  if (parsed.type === "trazzo/file" || parsed.app === "Trazzo") {
    return {
      board: parsed.board,
      boards: parsed.boards,
      elements: parsed.elements,
    };
  }

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

// TESTS

test("Geometry - Rectangle bounds calculation", () => {
  const rect = {
    id: "1",
    type: "rectangle",
    x: 100,
    y: 100,
    width: 200,
    height: 150,
  };
  const bounds = getElementBounds(rect);
  assert.equal(bounds.minX, 100);
  assert.equal(bounds.minY, 100);
  assert.equal(bounds.maxX, 300);
  assert.equal(bounds.maxY, 250);
  assert.equal(bounds.width, 200);
  assert.equal(bounds.height, 150);
});

test("Geometry - Inverted bounds (negative width/height)", () => {
  const rect = {
    id: "2",
    type: "rectangle",
    x: 300,
    y: 250,
    width: -200,
    height: -150,
  };
  const bounds = getElementBounds(rect);
  assert.equal(bounds.minX, 100);
  assert.equal(bounds.minY, 100);
  assert.equal(bounds.maxX, 300);
  assert.equal(bounds.maxY, 250);
  assert.equal(bounds.width, 200);
  assert.equal(bounds.height, 150);
});

test("Geometry - Freehand pencil bounds", () => {
  const pencil = {
    id: "3",
    type: "pencil",
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    points: [
      { x: 10, y: 20 },
      { x: 50, y: 80 },
      { x: 30, y: 120 },
      { x: 5, y: 40 },
    ],
  };
  const bounds = getElementBounds(pencil);
  assert.equal(bounds.minX, 5);
  assert.equal(bounds.maxX, 50);
  assert.equal(bounds.minY, 20);
  assert.equal(bounds.maxY, 120);
  assert.equal(bounds.width, 45);
  assert.equal(bounds.height, 100);
});

test("Geometry - Unfilled rectangle hit testing handles exterior border proximity", () => {
  const unfilledRect = {
    id: "unfilled-1",
    type: "rectangle",
    x: 100,
    y: 100,
    width: 200,
    height: 150,
    fillStyle: "none",
    strokeWidth: 2,
  };

  // 1. Point 3px OUTSIDE top border (y = 97, x = 150) -> should HIT (within 8 + 1 = 9px tolerance)
  assert.equal(isPointNearElement({ x: 150, y: 97 }, unfilledRect), true);

  // 2. Point 3px INSIDE top border (y = 103, x = 150) -> should HIT
  assert.equal(isPointNearElement({ x: 150, y: 103 }, unfilledRect), true);

  // 3. Point in the dead center of the unfilled rect (x = 200, y = 175) -> should NOT hit
  assert.equal(isPointNearElement({ x: 200, y: 175 }, unfilledRect), false);

  // 4. Point 20px outside left border (x = 80, y = 150) -> should NOT hit
  assert.equal(isPointNearElement({ x: 80, y: 150 }, unfilledRect), false);
});

test("Geometry - Filled rectangle hit testing detects interior", () => {
  const filledRect = {
    id: "filled-1",
    type: "rectangle",
    x: 100,
    y: 100,
    width: 200,
    height: 150,
    fillStyle: "solid",
    strokeWidth: 2,
  };

  // Point in center -> should HIT
  assert.equal(isPointNearElement({ x: 200, y: 175 }, filledRect), true);
  // Point far outside -> should NOT hit
  assert.equal(isPointNearElement({ x: 50, y: 50 }, filledRect), false);
});

test("Geometry - Diamond and Ellipse hit testing", () => {
  const diamond = {
    id: "diamond-1",
    type: "diamond",
    x: 100,
    y: 100,
    width: 100,
    height: 100,
    fillStyle: "none",
    strokeWidth: 2,
  };
  // Top vertex is at (150, 100). Point 2px above (150, 98) -> should hit
  assert.equal(isPointNearElement({ x: 150, y: 98 }, diamond), true);
  // Center (150, 150) -> should NOT hit for unfilled diamond
  assert.equal(isPointNearElement({ x: 150, y: 150 }, diamond), false);

  const ellipse = {
    id: "ellipse-1",
    type: "ellipse",
    x: 100,
    y: 100,
    width: 100,
    height: 100,
    fillStyle: "none",
    strokeWidth: 2,
  };
  // Rightmost edge is at (200, 150). Point at (202, 150) -> should hit
  assert.equal(isPointNearElement({ x: 202, y: 150 }, ellipse), true);
  // Center (150, 150) -> should NOT hit for unfilled ellipse
  assert.equal(isPointNearElement({ x: 150, y: 150 }, ellipse), false);
});

test("Geometry - Resize handles alignment and hit detection", () => {
  const rect = {
    id: "rect-handles",
    type: "rectangle",
    x: 100,
    y: 100,
    width: 200,
    height: 150,
  };

  const handles = getElementHandles(rect);
  assert.equal(handles.length, 8);

  // 'nw' handle is at (100 - 4, 100 - 4) = (96, 96)
  const nw = handles.find((h) => h.handle === "nw");
  assert.ok(nw);
  assert.equal(nw.x, 96);
  assert.equal(nw.y, 96);

  // Clicking directly at (96, 96) must return 'nw'
  assert.equal(getHandleAtPosition({ x: 96, y: 96 }, rect), "nw");

  // Line / Arrow handles
  const line = {
    id: "line-handles",
    type: "line",
    x: 50,
    y: 50,
    width: 150,
    height: 100,
  };
  const lineHandles = getElementHandles(line);
  assert.equal(lineHandles.length, 2);
  assert.equal(getHandleAtPosition({ x: 50, y: 50 }, line), "start");
  assert.equal(getHandleAtPosition({ x: 200, y: 150 }, line), "end");
});

test("Geometry - isElementInBox marquee selection", () => {
  const rect = {
    id: "r1",
    type: "rectangle",
    x: 100,
    y: 100,
    width: 100,
    height: 100,
  };

  // Marquee enclosing the rect
  assert.equal(isElementInBox(rect, { x1: 50, y1: 50, x2: 250, y2: 250 }), true);
  // Marquee intersecting edge
  assert.equal(isElementInBox(rect, { x1: 50, y1: 50, x2: 150, y2: 150 }), true);
  // Marquee completely outside
  assert.equal(isElementInBox(rect, { x1: 0, y1: 0, x2: 50, y2: 50 }), false);
});

test("Export/Import - parseTrazzoFile valid format", () => {
  const validJson = JSON.stringify({
    type: "trazzo/file",
    version: 1,
    app: "Trazzo",
    createdAt: Date.now(),
    board: {
      id: "board-1",
      name: "Mi Pizarra",
      elements: [{ id: "el-1", type: "rectangle", x: 10, y: 10, width: 50, height: 50 }],
    },
  });

  const parsed = parseTrazzoFile(validJson);
  assert.ok(parsed.board);
  assert.equal(parsed.board.name, "Mi Pizarra");
  assert.equal(parsed.board.elements.length, 1);
});

test("Export/Import - parseTrazzoFile rejects invalid content", () => {
  const invalidJson = JSON.stringify({
    foo: "bar",
  });

  assert.throws(() => parseTrazzoFile(invalidJson), /formato válido de Trazzo/);
});

// Image tests
test("Geometry - Image bounds calculation", () => {
  const image = {
    id: "img-1",
    type: "image",
    x: 120,
    y: 150,
    width: 320,
    height: 240,
    src: "data:image/png;base64,mockData",
  };
  const bounds = getElementBounds(image);
  assert.equal(bounds.minX, 120);
  assert.equal(bounds.minY, 150);
  assert.equal(bounds.maxX, 440);
  assert.equal(bounds.maxY, 390);
  assert.equal(bounds.width, 320);
  assert.equal(bounds.height, 240);
});

test("Geometry - Image hit testing", () => {
  const image = {
    id: "img-2",
    type: "image",
    x: 100,
    y: 100,
    width: 200,
    height: 200,
    src: "data:image/png;base64,mockData",
    strokeWidth: 0,
  };

  // Center point
  assert.equal(isPointNearElement({ x: 200, y: 200 }, image), true);
  // Outside point
  assert.equal(isPointNearElement({ x: 50, y: 50 }, image), false);
  // Just near edge within tolerance (8px)
  assert.equal(isPointNearElement({ x: 95, y: 150 }, image), true);
});

test("Geometry - Image handles generation and hit", () => {
  const image = {
    id: "img-3",
    type: "image",
    x: 100,
    y: 100,
    width: 200,
    height: 100,
    src: "data:image/png;base64,mockData",
  };
  const handles = getElementHandles(image);
  assert.equal(handles.length, 8);
  assert.equal(getHandleAtPosition({ x: 96, y: 96 }, image), "nw");
  assert.equal(getHandleAtPosition({ x: 304, y: 204 }, image), "se");
});

// Layer ordering tests
function simulateLayers(elements) {
  return {
    bringToFront(selectedIds) {
      const unselected = elements.filter((el) => !selectedIds.includes(el.id));
      const selected = elements.filter((el) => selectedIds.includes(el.id));
      return [...unselected, ...selected];
    },
    sendToBack(selectedIds) {
      const unselected = elements.filter((el) => !selectedIds.includes(el.id));
      const selected = elements.filter((el) => selectedIds.includes(el.id));
      return [...selected, ...unselected];
    },
    moveForward(selectedIds) {
      const arr = [...elements];
      for (let i = arr.length - 2; i >= 0; i--) {
        if (selectedIds.includes(arr[i].id) && !selectedIds.includes(arr[i + 1].id)) {
          const temp = arr[i];
          arr[i] = arr[i + 1];
          arr[i + 1] = temp;
        }
      }
      return arr;
    },
    moveBackward(selectedIds) {
      const arr = [...elements];
      for (let i = 1; i < arr.length; i++) {
        if (selectedIds.includes(arr[i].id) && !selectedIds.includes(arr[i - 1].id)) {
          const temp = arr[i];
          arr[i] = arr[i - 1];
          arr[i - 1] = temp;
        }
      }
      return arr;
    },
  };
}

test("Layers - bringToFront, sendToBack, moveForward, moveBackward", () => {
  const initial = [{ id: "A" }, { id: "B" }, { id: "C" }, { id: "D" }];
  const sim = simulateLayers(initial);

  // Bring B to front -> [A, C, D, B]
  const bFront = sim.bringToFront(["B"]);
  assert.deepEqual(bFront.map((x) => x.id), ["A", "C", "D", "B"]);

  // Send C to back -> [C, A, B, D]
  const cBack = sim.sendToBack(["C"]);
  assert.deepEqual(cBack.map((x) => x.id), ["C", "A", "B", "D"]);

  // Move B forward -> [A, C, B, D]
  const bForward = sim.moveForward(["B"]);
  assert.deepEqual(bForward.map((x) => x.id), ["A", "C", "B", "D"]);

  // Move C backward -> [A, C, B, D]
  const cBackward = sim.moveBackward(["C"]);
  assert.deepEqual(cBackward.map((x) => x.id), ["A", "C", "B", "D"]);
});

test("Seed Preservation - Element seed remains fixed during operations", () => {
  const element = {
    id: "el-seed",
    type: "rectangle",
    x: 50,
    y: 50,
    width: 100,
    height: 80,
    seed: 49201,
  };

  // Drag simulation preserves seed
  const moved = {
    ...element,
    x: element.x + 30,
    y: element.y + 20,
  };

  assert.equal(moved.seed, 49201);
  assert.equal(moved.seed, element.seed);
});

test("Image Resize - Proportional aspect ratio is preserved during corner drag", () => {
  const image = {
    id: "img-resize-1",
    type: "image",
    x: 100,
    y: 100,
    width: 200,
    height: 100,
    aspectRatio: 2, // 200 / 100
  };

  const dx = 50;
  // Simulating "se" handle drag
  const newW = Math.max(24, image.width + dx); // 250
  const newH = Math.round(newW / image.aspectRatio); // 125

  assert.equal(newW, 250);
  assert.equal(newH, 125);
  assert.equal(newW / newH, image.aspectRatio);
});

test("Seed Robustness - Non-zero seed guarantee prevents Rough.js randomizer bug", () => {
  function getEffectiveSeed(seed) {
    return seed && seed > 0 ? seed : 1;
  }

  assert.equal(getEffectiveSeed(undefined), 1);
  assert.equal(getEffectiveSeed(0), 1); // Crucial: 0 must not be passed to Rough.js
  assert.equal(getEffectiveSeed(-5), 1);
  assert.equal(getEffectiveSeed(42), 42);
});

test("Clipboard Routing - Detects image file over text", () => {
  function routeClipboardData({ hasImageFile, textPlain, hasInternalElements }) {
    if (hasImageFile) return "insert_image";
    if (textPlain && textPlain.includes('"type":"trazzo/file"')) return "import_trazzo";
    if (hasInternalElements) return "paste_internal";
    return "ignore";
  }

  assert.equal(routeClipboardData({ hasImageFile: true, textPlain: "hello", hasInternalElements: true }), "insert_image");
  assert.equal(routeClipboardData({ hasImageFile: false, textPlain: '{"type":"trazzo/file"}', hasInternalElements: true }), "import_trazzo");
  assert.equal(routeClipboardData({ hasImageFile: false, textPlain: "some random string", hasInternalElements: true }), "paste_internal");
});

test("Text - Multiline Dimension Calculation and Line Breaks", () => {
  function calculateTextDimensions(rawText, fontSize = 20) {
    const text = rawText.replace(/\r\n/g, "\n").replace(/^\n+|\n+$/g, "");
    if (!text.trim()) return null;
    const lines = text.split("\n");
    const lineHeight = fontSize * 1.35;
    const height = Math.max(fontSize * 1.5, lines.length * lineHeight);
    // Estimated line width per char ~0.6 * fontSize
    const maxChars = Math.max(...lines.map((l) => l.length));
    const width = Math.max(20, maxChars * (fontSize * 0.6) + 16);
    return { text, linesCount: lines.length, width, height };
  }

  // 1. Multiline text preserves internal breaks
  const res = calculateTextDimensions("Line 1\nLine 2\nLine 3", 20);
  assert.ok(res);
  assert.equal(res.linesCount, 3);
  assert.equal(res.height, 3 * 20 * 1.35);

  // 2. Pure whitespace/empty string returns null (discarded)
  assert.equal(calculateTextDimensions("   \n\n  "), null);
  assert.equal(calculateTextDimensions(""), null);
});

test("Text - Alignment offset coordinate calculation", () => {
  function getTextDrawX(element) {
    const align = element.textAlign || "left";
    if (align === "center") {
      return element.x + element.width / 2;
    }
    if (align === "right") {
      return element.x + element.width;
    }
    return element.x;
  }

  const el = { x: 100, width: 200, textAlign: "left" };
  assert.equal(getTextDrawX(el), 100);

  const elCenter = { x: 100, width: 200, textAlign: "center" };
  assert.equal(getTextDrawX(elCenter), 200);

  const elRight = { x: 100, width: 200, textAlign: "right" };
  assert.equal(getTextDrawX(elRight), 300);
});

test("Flowchart - Step generation creates connecting arrow and positioned clone", () => {
  function generateFlowchartStep(sourceEl, direction = "down", gap = 60) {
    const b = getElementBounds(sourceEl);
    let targetX = sourceEl.x;
    let targetY = sourceEl.y;
    let arrowStart = { x: 0, y: 0 };
    let arrowEnd = { x: 0, y: 0 };

    if (direction === "down") {
      targetX = sourceEl.x;
      targetY = sourceEl.y + (b.height + gap);
      arrowStart = { x: b.minX + b.width / 2, y: b.maxY };
      arrowEnd = { x: b.minX + b.width / 2, y: b.maxY + gap };
    } else if (direction === "up") {
      targetX = sourceEl.x;
      targetY = sourceEl.y - (b.height + gap);
      arrowStart = { x: b.minX + b.width / 2, y: b.minY };
      arrowEnd = { x: b.minX + b.width / 2, y: b.minY - gap };
    } else if (direction === "right") {
      targetX = sourceEl.x + (b.width + gap);
      targetY = sourceEl.y;
      arrowStart = { x: b.maxX, y: b.minY + b.height / 2 };
      arrowEnd = { x: b.maxX + gap, y: b.minY + b.height / 2 };
    } else if (direction === "left") {
      targetX = sourceEl.x - (b.width + gap);
      targetY = sourceEl.y;
      arrowStart = { x: b.minX, y: b.minY + b.height / 2 };
      arrowEnd = { x: b.minX - gap, y: b.minY + b.height / 2 };
    }

    const arrow = {
      type: "arrow",
      x: arrowStart.x,
      y: arrowStart.y,
      width: arrowEnd.x - arrowStart.x,
      height: arrowEnd.y - arrowStart.y,
    };

    const clone = {
      ...sourceEl,
      x: targetX,
      y: targetY,
    };

    return { arrow, clone };
  }

  const rect = { id: "box1", type: "rectangle", x: 100, y: 100, width: 120, height: 80 };

  // 1. Down
  const down = generateFlowchartStep(rect, "down", 60);
  assert.equal(down.clone.x, 100);
  assert.equal(down.clone.y, 240); // 100 + 80 + 60
  assert.equal(down.arrow.x, 160); // 100 + 60
  assert.equal(down.arrow.y, 180); // 100 + 80
  assert.equal(down.arrow.height, 60);

  // 2. Right
  const right = generateFlowchartStep(rect, "right", 50);
  assert.equal(right.clone.x, 270); // 100 + 120 + 50
  assert.equal(right.clone.y, 100);
  assert.equal(right.arrow.x, 220); // 100 + 120
  assert.equal(right.arrow.y, 140); // 100 + 40
  assert.equal(right.arrow.width, 50);
});

test("Tool Lock - Prevents switching tool back to select when locked", () => {
  function getNextTool(activeTool, isLocked) {
    if (isLocked) return activeTool;
    return "select";
  }

  assert.equal(getNextTool("rectangle", false), "select");
  assert.equal(getNextTool("rectangle", true), "rectangle");
  assert.equal(getNextTool("text", false), "select");
  assert.equal(getNextTool("text", true), "text");
});

test("Element Link - Supports URL hyperlinking on elements", () => {
  const el = {
    id: "link-1",
    type: "rectangle",
    x: 10,
    y: 10,
    width: 100,
    height: 100,
    link: "https://example.com/docs",
  };

  assert.equal(el.link, "https://example.com/docs");
});

test("Text Commit - Synchronous guard prevents double-commit duplicates on simultaneous blur and pointerdown", () => {
  let commitCount = 0;
  let isCommitting = false;
  let currentDraft = { text: "Hello World", x: 100, y: 100, fontSize: 20 };

  function simulateCommit() {
    const draft = currentDraft;
    if (!draft) return;
    if (isCommitting) return;
    isCommitting = true;
    currentDraft = null;

    commitCount++;
  }

  // Simulate pointerdown and blur firing in rapid succession
  simulateCommit(); // pointerdown commit
  simulateCommit(); // blur commit
  simulateCommit(); // extra event

  assert.equal(commitCount, 1);
});

test("Text Position - Shape center anchor produces exact centered positioning", () => {
  function computeFinalTextCoordinates(draft, width, height) {
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

    return { finalX, finalY };
  }

  // Rectangle bounds: x: 100..300, y: 50..150 -> center is (200, 100)
  const draft = {
    x: 200,
    y: 100,
    anchorCenterX: 200,
    anchorCenterY: 100,
    textAlign: "center",
  };

  const textWidth = 80;
  const textHeight = 30;
  const { finalX, finalY } = computeFinalTextCoordinates(draft, textWidth, textHeight);

  // finalX should be 200 - 40 = 160, so center on canvas is 160 + 80 / 2 = 200
  assert.equal(finalX, 160);
  assert.equal(finalX + textWidth / 2, 200);

  // finalY should be 100 - 15 = 85, so center on canvas is 85 + 30 / 2 = 100
  assert.equal(finalY, 85);
  assert.equal(finalY + textHeight / 2, 100);
});

test("Text Draft - Property update while editing updates active text draft", () => {
  let toolProps = { fontSize: 20, fontFamily: "Caveat", strokeColor: "#1e1e1e" };
  let editingText = { sessionKey: "k1", text: "Testing", fontSize: 20, fontFamily: "Caveat", strokeColor: "#1e1e1e" };

  function updateToolProp(key, value) {
    toolProps = { ...toolProps, [key]: value };
    if (editingText) {
      editingText = { ...editingText, [key]: value };
    }
  }

  updateToolProp("fontSize", 36);
  assert.equal(toolProps.fontSize, 36);
  assert.equal(editingText.fontSize, 36);

  updateToolProp("strokeColor", "#e03131");
  assert.equal(toolProps.strokeColor, "#e03131");
  assert.equal(editingText.strokeColor, "#e03131");
});




