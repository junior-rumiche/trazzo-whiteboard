import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  FONT_HAND,
  FONT_SANS,
  FONT_CODE,
  createDefaultBoard,
  loadBoardsFromStorage,
} from "../src/lib/storage.ts";

test("Font Stability - Font constants are defined and non-empty", () => {
  assert.ok(FONT_HAND.includes("Caveat"), "FONT_HAND should include Caveat");
  assert.ok(FONT_SANS.includes("Inter"), "FONT_SANS should include Inter");
  assert.ok(FONT_CODE.includes("JetBrains Mono"), "FONT_CODE should include JetBrains Mono");
});

test("Font Stability - Default welcome elements use FONT_SANS to prevent cursive shift bug", () => {
  const board = createDefaultBoard();
  const textElements = board.elements.filter((el) => el.type === "text");
  assert.ok(textElements.length >= 2, "Expected at least 2 text elements on default board");

  for (const textEl of textElements) {
    assert.strictEqual(
      textEl.fontFamily,
      FONT_SANS,
      `Welcome text "${textEl.text.slice(0, 20)}..." should use FONT_SANS to ensure clear, consistent rendering without shrinking or cursive morphing`
    );
  }
});

test("Font Stability - loadBoardsFromStorage migrates both legacy and current welcome elements to FONT_SANS", () => {
  // Mock localStorage
  const dummyBoards = [
    {
      id: "b1",
      name: "Test Board",
      elements: [
        {
          id: "t1_legacy",
          type: "text",
          text: "¡Bienvenido a Trazzo!\n\n• Dibuja libremente con lápiz o figuras...",
          fontSize: 22,
          fontFamily: "Caveat, cursive, sans-serif",
        },
        {
          id: "t1_modern",
          type: "text",
          text: "¡Bienvenido a Trazzo Whiteboard!\n\n• Dibuja libremente...",
          fontSize: 22,
          fontFamily: "Caveat, cursive, sans-serif",
        },
        {
          id: "t2",
          type: "text",
          text: "¡Pruébame!",
          fontSize: 20,
          fontFamily: "Caveat, cursive, sans-serif",
        },
        {
          id: "t3",
          type: "text",
          text: "User Custom Text",
          fontSize: 24,
          fontFamily: "Caveat, cursive, sans-serif",
        },
      ],
      viewTransform: { x: 0, y: 0, zoom: 1 },
      backgroundColor: "#ffffff",
      gridEnabled: true,
      createdAt: 1000,
      updatedAt: 1000,
    },
  ];

  const storageMap = new Map();
  storageMap.set("trazzo_boards_v1", JSON.stringify(dummyBoards));

  globalThis.window = {};
  globalThis.localStorage = {
    getItem: (key) => storageMap.get(key) || null,
    setItem: (key, val) => storageMap.set(key, val),
    removeItem: (key) => storageMap.delete(key),
    clear: () => storageMap.clear(),
  };

  try {
    const loaded = loadBoardsFromStorage();
    const legacy = loaded[0].elements.find((el) => el.id === "t1_legacy");
    const modern = loaded[0].elements.find((el) => el.id === "t1_modern");
    const pruebame = loaded[0].elements.find((el) => el.id === "t2");
    const custom = loaded[0].elements.find((el) => el.id === "t3");

    assert.strictEqual(legacy.fontFamily, FONT_SANS, "Legacy welcome text must be migrated to FONT_SANS");
    assert.strictEqual(modern.fontFamily, FONT_SANS, "Modern welcome text must be migrated to FONT_SANS");
    assert.strictEqual(pruebame.fontFamily, FONT_SANS, "¡Pruébame! text must be migrated to FONT_SANS");
    assert.strictEqual(custom.fontFamily, "Caveat, cursive, sans-serif", "User custom text font should remain untouched");
  } finally {
    delete globalThis.window;
    delete globalThis.localStorage;
  }
});

test("Font Stability - layout.tsx contains preconnect, stylesheet links, and hidden DOM font preloader", () => {
  const layoutPath = path.resolve("src/app/layout.tsx");
  const layoutCode = fs.readFileSync(layoutPath, "utf-8");

  assert.ok(
    layoutCode.includes('rel="preconnect" href="https://fonts.googleapis.com"'),
    "layout.tsx must preconnect to fonts.googleapis.com"
  );
  assert.ok(
    layoutCode.includes('rel="preconnect" href="https://fonts.gstatic.com"'),
    "layout.tsx must preconnect to fonts.gstatic.com"
  );
  assert.ok(
    layoutCode.includes('family=Caveat') && layoutCode.includes('family=Inter'),
    "layout.tsx must include stylesheet link for Caveat and Inter"
  );
  assert.ok(
    layoutCode.includes('fontFamily: "Caveat"') && layoutCode.includes('fontFamily: "Inter"'),
    "layout.tsx must include hidden DOM preloader elements so browser fetches font assets eagerly on HTML parse"
  );
});

test("Font Stability - Canvas.tsx actively loads fonts and updates fontVersion", () => {
  const canvasPath = path.resolve("src/components/Canvas.tsx");
  const canvasCode = fs.readFileSync(canvasPath, "utf-8");

  assert.ok(
    canvasCode.includes('document.fonts.load("20px Caveat")'),
    "Canvas.tsx must actively load Caveat font via document.fonts.load"
  );
  assert.ok(
    canvasCode.includes("fontVersion"),
    "Canvas.tsx must use a fontVersion counter to force re-render on font load"
  );
  assert.ok(
    canvasCode.includes('document.fonts.addEventListener("loadingdone"'),
    "Canvas.tsx must listen to font loadingdone event"
  );
});

test("Font Stability - export.ts actively awaits document.fonts.load", () => {
  const exportPath = path.resolve("src/lib/export.ts");
  const exportCode = fs.readFileSync(exportPath, "utf-8");

  assert.ok(
    exportCode.includes('document.fonts.load("20px Caveat")'),
    "export.ts must actively load fonts before rendering export canvas"
  );
});

test("Font Stability - PropertiesPanel does not contain 'Virgil' third-party trademark", () => {
  const panelPath = path.resolve("src/components/PropertiesPanel.tsx");
  const panelCode = fs.readFileSync(panelPath, "utf-8").toLowerCase();

  assert.strictEqual(
    panelCode.includes("virgil"),
    false,
    "PropertiesPanel must not reference 'Virgil'"
  );
});
