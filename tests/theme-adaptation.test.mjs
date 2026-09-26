import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveThemeColor,
  isColorDark,
  parseColorToRgb,
  getRelativeLuminance,
} from "../src/lib/renderer.ts";

test("Theme Color - parses hex and rgb formats accurately", () => {
  const c1 = parseColorToRgb("#1e1e1e");
  assert.deepEqual(c1, { r: 30, g: 30, b: 30 });

  const c2 = parseColorToRgb("#ffffff");
  assert.deepEqual(c2, { r: 255, g: 255, b: 255 });

  const c3 = parseColorToRgb("rgb(99, 102, 241)");
  assert.deepEqual(c3, { r: 99, g: 102, b: 241 });

  assert.equal(parseColorToRgb("transparent"), null);
  assert.equal(parseColorToRgb("none"), null);
});

test("Theme Color - isColorDark correctly categorizes colors", () => {
  assert.equal(isColorDark("#121214"), true);
  assert.equal(isColorDark("#1e1e1e"), true);
  assert.equal(isColorDark("#000000"), true);
  assert.equal(isColorDark("#ffffff"), false);
  assert.equal(isColorDark("#fbfbfe"), false);
  assert.equal(isColorDark("transparent"), false);
});

test("Theme Color - Dark mode converts light-mode black strokes to crisp white/cream", () => {
  // Common light-mode dark stroke colors
  assert.equal(resolveThemeColor("#1e1e1e", true, true), "#f8f9fa");
  assert.equal(resolveThemeColor("#1e1e24", true, true), "#f8f9fa");
  assert.equal(resolveThemeColor("#000000", true, true), "#f8f9fa");
  assert.equal(resolveThemeColor("#111827", true, true), "#f8f9fa");
  assert.equal(resolveThemeColor("#2d3748", true, true), "#f8f9fa");
});

test("Theme Color - Light mode converts dark-mode white strokes back to dark charcoal", () => {
  assert.equal(resolveThemeColor("#f8f9fa", false, true), "#1e1e1e");
  assert.equal(resolveThemeColor("#ffffff", false, true), "#1e1e1e");
  assert.equal(resolveThemeColor("#fbfbfe", false, true), "#1e1e1e");
});

test("Theme Color - Dark mode maps palette colors to vibrant high-contrast equivalents", () => {
  assert.equal(resolveThemeColor("#e03131", true, true), "#ff8787"); // Red
  assert.equal(resolveThemeColor("#2f9e44", true, true), "#69db7c"); // Green
  assert.equal(resolveThemeColor("#1971c2", true, true), "#74c0fc"); // Blue
  assert.equal(resolveThemeColor("#f08c00", true, true), "#ffd43b"); // Amber
  assert.equal(resolveThemeColor("#697077", true, true), "#ced4da"); // Gray
  assert.equal(resolveThemeColor("#6366f1", true, true), "#a5b4fc"); // Indigo
});

test("Theme Color - Custom dark stroke is boosted in lightness to guarantee high contrast in dark mode", () => {
  // An arbitrary deep dark navy that would otherwise be invisible on #121214
  const darkNavy = "#022c43";
  const resolved = resolveThemeColor(darkNavy, true, true);
  assert.notEqual(resolved, darkNavy);
  assert.equal(isColorDark(resolved), false); // must now be light/high contrast
});

test("Theme Color - Transparent and already high-contrast colors are preserved", () => {
  assert.equal(resolveThemeColor("transparent", true, false), "transparent");
  assert.equal(resolveThemeColor("none", true, false), "none");

  // Vibrant neon cyan is already bright on dark background, so it remains intact
  const brightCyan = "#22d3ee";
  assert.equal(resolveThemeColor(brightCyan, true, true), brightCyan);
});

test("Theme Color - Solid white fill becomes dark surface in dark mode", () => {
  assert.equal(resolveThemeColor("#ffffff", true, false, "solid"), "#232328");
  assert.equal(resolveThemeColor("#f8f9fa", true, false, "solid"), "#232328");
});
