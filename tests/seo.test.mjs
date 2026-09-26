import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import robotsConfig from "../src/app/robots.ts";
import sitemapConfig from "../src/app/sitemap.ts";
import manifestConfig from "../src/app/manifest.ts";

test("SEO - robots.ts returns valid configuration for crawlers", () => {
  const robots = robotsConfig();
  assert.ok(robots.rules, "Robots must include rules");
  assert.strictEqual(robots.rules.userAgent, "*");
  assert.strictEqual(robots.rules.allow, "/");
  assert.ok(robots.sitemap && robots.sitemap.endsWith("/sitemap.xml"), "Robots must link to sitemap.xml");
});

test("SEO - sitemap.ts generates valid root entry with optimal priority", () => {
  const sitemap = sitemapConfig();
  assert.ok(Array.isArray(sitemap), "Sitemap must return an array");
  assert.ok(sitemap.length >= 1, "Sitemap must have at least one entry");
  
  const rootEntry = sitemap[0];
  assert.ok(rootEntry.url.startsWith("http"), "Sitemap URL must be an absolute HTTP/HTTPS URL");
  assert.strictEqual(rootEntry.priority, 1.0, "Root entry should have priority 1.0");
  assert.strictEqual(rootEntry.changeFrequency, "weekly");
});

test("SEO - manifest.ts provides PWA metadata", () => {
  const manifest = manifestConfig();
  assert.strictEqual(manifest.name, "Trazzo — Pizarra Virtual y Diagramas");
  assert.strictEqual(manifest.short_name, "Trazzo");
  assert.strictEqual(manifest.display, "standalone");
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 3, "Manifest must have standard icons (192, 512, svg)");
  assert.ok(manifest.icons.some(i => i.sizes === "192x192"), "Must have 192x192 icon for mobile install");
  assert.ok(manifest.icons.some(i => i.sizes === "512x512"), "Must have 512x512 icon for splash screens");
  assert.ok(manifest.icons.some(i => i.purpose?.includes("maskable")), "Must support maskable icon");
});

test("SEO - layout.tsx contains valid Schema.org JSON-LD structured data", () => {
  const layoutPath = path.resolve("src/app/layout.tsx");
  const layoutCode = fs.readFileSync(layoutPath, "utf-8");

  assert.ok(layoutCode.includes('type="application/ld+json"'), "Layout must include JSON-LD script");
  assert.ok(layoutCode.includes('"WebApplication"'), "Must define WebApplication schema");
  assert.ok(layoutCode.includes('"SoftwareApplication"'), "Must define SoftwareApplication schema");
  assert.ok(layoutCode.includes('"Organization"'), "Must define Organization schema");
  assert.ok(layoutCode.includes('"WebSite"'), "Must define WebSite schema");
  assert.ok(layoutCode.includes('name: "Trazzo"'), "Schema must identify app as Trazzo");
});

test("SEO - layout.tsx defines rich metadata and OpenGraph configuration", () => {
  const layoutPath = path.resolve("src/app/layout.tsx");
  const layoutCode = fs.readFileSync(layoutPath, "utf-8");

  assert.ok(layoutCode.includes("metadataBase"), "Metadata must include metadataBase");
  assert.ok(layoutCode.includes("openGraph"), "Metadata must configure openGraph");
  assert.ok(layoutCode.includes("twitter"), "Metadata must configure twitter card");
  assert.ok(layoutCode.includes("keywords"), "Metadata must provide keywords");
  assert.ok(layoutCode.includes("viewport"), "Viewport must be defined");
  assert.ok(layoutCode.includes("apple:"), "Metadata must define apple touch icon");
  assert.ok(layoutCode.includes("/favicon.ico"), "Metadata must reference favicon.ico");
});

test("SEO - page.tsx includes crawlable semantic HTML and noscript fallback", () => {
  const pagePath = path.resolve("src/app/page.tsx");
  const pageCode = fs.readFileSync(pagePath, "utf-8");

  assert.ok(pageCode.includes("<h1"), "Must include H1 heading");
  assert.ok(pageCode.includes("<h2"), "Must include H2 headings");
  assert.ok(pageCode.includes("<noscript>"), "Must include noscript tag for non-JS crawlers");
  assert.ok(pageCode.includes("sr-only"), "Must use sr-only for crawler/screen-reader semantics");
  assert.ok(pageCode.includes("<footer"), "Must include semantic footer");
});

test("SEO - static icon assets exist and are accessible", () => {
  assert.ok(fs.existsSync(path.resolve("public/favicon.ico")), "public/favicon.ico must exist");
  assert.ok(fs.existsSync(path.resolve("public/icon-192.png")), "public/icon-192.png must exist");
  assert.ok(fs.existsSync(path.resolve("public/icon-512.png")), "public/icon-512.png must exist");
  assert.ok(fs.existsSync(path.resolve("public/icon.svg")), "public/icon.svg must exist");
});

test("SEO & Compliance - Codebase contains zero forbidden third-party trademarks", () => {
  const forbidden = ["excali", "draw"].join("");
  const dirsToScan = ["src", "tests"];

  function scanDir(dir) {
    const fullDir = path.resolve(dir);
    if (!fs.existsSync(fullDir)) return;
    const entries = fs.readdirSync(fullDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(fullDir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (/\.(ts|tsx|js|mjs|json|md)$/.test(entry.name) && entry.name !== "seo.test.mjs") {
        const content = fs.readFileSync(fullPath, "utf-8").toLowerCase();
        assert.strictEqual(
          content.includes(forbidden),
          false,
          `File ${path.relative(process.cwd(), fullPath)} contains forbidden trademark`
        );
      }
    }
  }

  dirsToScan.forEach(scanDir);
});
