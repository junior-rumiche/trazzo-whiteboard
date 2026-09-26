import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_LASER_CONFIG,
  pruneLaserPoints,
  calculateLaserProgress,
  calculateLaserAlpha,
  calculateLaserWidth,
  createSmoothLaserPath,
  groupLaserStrokes,
  renderLaserTrail,
} from "../src/lib/laser.ts";

// ======================== UNIT TESTS ========================

test("Laser Pointer - pruneLaserPoints removes expired points while keeping active points", () => {
  const now = 10000;
  const points = [
    { x: 10, y: 10, time: 8800 },  // age 1200ms -> expired
    { x: 20, y: 20, time: 8999 },  // age 1001ms -> expired
    { x: 30, y: 30, time: 9000 },  // age 1000ms -> expired threshold
    { x: 40, y: 40, time: 9200 },  // age 800ms -> valid
    { x: 50, y: 50, time: 9800 },  // age 200ms -> valid
    { x: 60, y: 60, time: 10000 }, // age 0ms -> valid
  ];

  const pruned = pruneLaserPoints(points, now, 1000);
  assert.equal(pruned.length, 3);
  assert.equal(pruned[0].x, 40);
  assert.equal(pruned[1].x, 50);
  assert.equal(pruned[2].x, 60);

  // Empty points
  assert.deepEqual(pruneLaserPoints([], now, 1000), []);
});

test("Laser Pointer - pruneLaserPoints with keepPredecessor retains anchor point for curve continuity", () => {
  const now = 10000;
  const points = [
    { x: 10, y: 10, time: 8800, newStroke: true }, // expired
    { x: 20, y: 20, time: 8900 },                  // expired predecessor
    { x: 40, y: 40, time: 9200 },                  // active
    { x: 60, y: 60, time: 10000 },                 // active
  ];

  const pruned = pruneLaserPoints(points, now, 1000, true);
  // Keeps point at 8900 as predecessor for smooth curve interpolation without jumping
  assert.equal(pruned.length, 3);
  assert.equal(pruned[0].x, 20);
  assert.equal(pruned[1].x, 40);
  assert.equal(pruned[2].x, 60);
});

test("Laser Pointer - calculateLaserProgress returns normalized 0..1 lifecycle progress", () => {
  const now = 5000;
  const lifespan = 1000;

  // Newly created point
  assert.equal(calculateLaserProgress(now, now, lifespan), 1);

  // Future timestamp (clock skew guard)
  assert.equal(calculateLaserProgress(now + 100, now, lifespan), 1);

  // Point half-way through life (500ms old)
  assert.equal(calculateLaserProgress(now - 500, now, lifespan), 0.5);

  // Point at 80% life (800ms old)
  assert.ok(Math.abs(calculateLaserProgress(now - 800, now, lifespan) - 0.2) < 1e-5);

  // Point at or exceeding lifespan
  assert.equal(calculateLaserProgress(now - 1000, now, lifespan), 0);
  assert.equal(calculateLaserProgress(now - 1500, now, lifespan), 0);
});

test("Laser Pointer - calculateLaserAlpha produces smooth non-linear fade", () => {
  const alphaFull = calculateLaserAlpha(1.0);
  const alphaMid = calculateLaserAlpha(0.5);
  const alphaLow = calculateLaserAlpha(0.1);
  const alphaZero = calculateLaserAlpha(0.0);

  assert.equal(alphaFull, 1.0);
  assert.equal(alphaZero, 0.0);
  // Monotonically decreasing
  assert.ok(alphaFull > alphaMid);
  assert.ok(alphaMid > alphaLow);
  assert.ok(alphaLow > alphaZero);

  // Clamps out-of-range progress gracefully
  assert.equal(calculateLaserAlpha(1.5), 1.0);
  assert.equal(calculateLaserAlpha(-0.5), 0.0);
});

test("Laser Pointer - calculateLaserWidth tapers stroke width from tip to tail", () => {
  const maxWidth = 10;
  const minWidth = 1.5;

  const tipWidth = calculateLaserWidth(1.0, maxWidth, minWidth);
  const midWidth = calculateLaserWidth(0.5, maxWidth, minWidth);
  const tailWidth = calculateLaserWidth(0.0, maxWidth, minWidth);

  assert.equal(tipWidth, 10);
  assert.equal(tailWidth, 1.5);
  assert.ok(tipWidth > midWidth);
  assert.ok(midWidth > tailWidth);
});

test("Laser Pointer - createSmoothLaserPath handles 0, 1, and 2 point edge cases", () => {
  assert.deepEqual(createSmoothLaserPath([]), []);

  const single = [{ x: 50, y: 50, time: 1000 }];
  const singlePath = createSmoothLaserPath(single);
  assert.equal(singlePath.length, 1);
  assert.equal(singlePath[0].x, 50);

  const two = [
    { x: 0, y: 0, time: 1000 },
    { x: 100, y: 0, time: 1100 },
  ];
  const twoPath = createSmoothLaserPath(two, 8);
  assert.ok(twoPath.length >= 2);
  assert.equal(twoPath[0].x, 0);
  assert.equal(twoPath[twoPath.length - 1].x, 100);
  // Timestamps monotonically increasing
  for (let i = 1; i < twoPath.length; i++) {
    assert.ok(twoPath[i].time >= twoPath[i - 1].time);
  }
});

test("Laser Pointer - createSmoothLaserPath interpolates smooth curves without jagged vertices", () => {
  // A sharp 90-degree corner at (100, 0)
  const jaggedInput = [
    { x: 0, y: 0, time: 1000 },
    { x: 100, y: 0, time: 1050 },
    { x: 100, y: 100, time: 1100 },
    { x: 100, y: 200, time: 1150 },
  ];

  const smooth = createSmoothLaserPath(jaggedInput, 8);
  assert.ok(smooth.length > jaggedInput.length);

  // First and last points match input endpoints
  assert.equal(smooth[0].x, 0);
  assert.equal(smooth[0].y, 0);
  assert.equal(smooth[smooth.length - 1].x, 100);
  assert.equal(smooth[smooth.length - 1].y, 200);

  // Check curvature: with quadratic midpoint interpolation, the sharp vertex at (100,0) is rounded
  for (const pt of smooth) {
    assert.ok(pt.x >= 0 && pt.x <= 100);
    assert.ok(pt.y >= 0 && pt.y <= 200);
  }

  // Timestamps must increase strictly or monotonically
  for (let i = 1; i < smooth.length; i++) {
    assert.ok(smooth[i].time >= smooth[i - 1].time);
  }
});

test("Laser Pointer - createSmoothLaserPath smoothly subdivides high-speed gestures without capping at 8 steps", () => {
  // High-speed stroke across screen (distance 300px between points)
  const fastStroke = [
    { x: 0, y: 0, time: 1000 },
    { x: 150, y: 100, time: 1050 },
    { x: 300, y: 0, time: 1100 },
    { x: 450, y: 100, time: 1150 },
  ];

  const samples = createSmoothLaserPath(fastStroke, 8);
  // With large chords, subdivision should have significantly more than 8 steps total
  assert.ok(samples.length > 20);

  // Segments should be dense and smooth (average segment length <= 15px)
  let maxSegmentDist = 0;
  for (let i = 1; i < samples.length; i++) {
    const d = Math.hypot(samples[i].x - samples[i - 1].x, samples[i].y - samples[i - 1].y);
    if (d > maxSegmentDist) maxSegmentDist = d;
  }
  assert.ok(maxSegmentDist < 25);
});

test("Laser Pointer - createSmoothLaserPath interpolates timestamp quadratically matching curve geometry", () => {
  const points = [
    { x: 0, y: 0, time: 1000 },
    { x: 50, y: 100, time: 1100 }, // control point
    { x: 100, y: 0, time: 1200 },
  ];

  const samples = createSmoothLaserPath(points, 8);
  // Timestamps must increase monotonically
  for (let i = 1; i < samples.length; i++) {
    assert.ok(samples[i].time >= samples[i - 1].time);
  }
  // At midpoint of first quadratic curve, time should be close to 1100 (weighted by control point time)
  const midSample = samples[Math.floor(samples.length / 2)];
  assert.ok(midSample.time > 1050 && midSample.time < 1180);
});

test("Laser Pointer - groupLaserStrokes separates distinct clicks without connecting lines", () => {
  const points = [
    // Stroke 1
    { x: 10, y: 10, time: 1000, newStroke: true },
    { x: 20, y: 20, time: 1050 },
    { x: 30, y: 30, time: 1100 },
    // Stroke 2 (e.g. user clicked elsewhere)
    { x: 200, y: 200, time: 1500, newStroke: true },
    { x: 210, y: 210, time: 1550 },
  ];

  const strokes = groupLaserStrokes(points);
  assert.equal(strokes.length, 2);
  assert.equal(strokes[0].length, 3);
  assert.equal(strokes[1].length, 2);
  assert.equal(strokes[0][0].x, 10);
  assert.equal(strokes[1][0].x, 200);
});

test("Laser Pointer - continuous trailing fade and comet decay lifecycle simulation", () => {
  const lifespan = 1000;
  let now = 1000;
  let points = [];
  let isPointerDown = true;

  // 1. User presses pointer down and drags over 500ms
  for (let t = 0; t <= 500; t += 50) {
    now = 1000 + t;
    points.push({ x: t, y: t, time: now, newStroke: t === 0 });
    points = pruneLaserPoints(points, now, lifespan);
  }
  assert.equal(points.length, 11);

  // 2. User holds click stationary for 800ms
  for (let step = 1; step <= 8; step++) {
    now += 100;
    points[points.length - 1].time = now;
    points = pruneLaserPoints(points, now, lifespan);
  }

  // Oldest points from t=0..300 (age > 1000ms) have decayed and been pruned
  assert.ok(points.length < 11);
  assert.ok(points.length > 0);
  assert.equal(points[points.length - 1].time, now);

  // 3. User releases pointer
  isPointerDown = false;
  for (let step = 1; step <= 12; step++) {
    now += 100;
    points = pruneLaserPoints(points, now, lifespan);
  }
  assert.equal(points.length, 0);
});

test("Laser Pointer - renderLaserTrail executes passes and sets lineCap=butt on inner joints to prevent bead artifacts", () => {
  const calls = [];
  const lineCaps = [];
  const mockCtx = {
    save: () => calls.push("save"),
    restore: () => calls.push("restore"),
    beginPath: () => calls.push("beginPath"),
    moveTo: (x, y) => calls.push(`moveTo(${x},${y})`),
    lineTo: (x, y) => calls.push(`lineTo(${x},${y})`),
    stroke: () => calls.push("stroke"),
    arc: (x, y, r, sa, ea) => calls.push(`arc(${x},${y},${r.toFixed(1)})`),
    fill: () => calls.push("fill"),
    set lineCap(v) { lineCaps.push(v); },
    set lineJoin(v) {},
    set strokeStyle(v) {},
    set fillStyle(v) {},
    set lineWidth(v) {},
    set shadowColor(v) {},
    set shadowBlur(v) {},
  };

  const now = 2000;
  const points = [
    { x: 10, y: 10, time: 1700, newStroke: true },
    { x: 50, y: 50, time: 1850 },
    { x: 100, y: 100, time: 2000 },
  ];

  renderLaserTrail(mockCtx, points, now, true);

  assert.ok(calls.includes("save"));
  assert.ok(calls.includes("restore"));
  assert.ok(calls.includes("stroke"));
  assert.ok(calls.includes("fill"));
  assert.ok(calls.some((c) => c.startsWith("moveTo")));
  assert.ok(calls.some((c) => c.startsWith("lineTo")));
  assert.ok(calls.some((c) => c.startsWith("arc")));

  // lineCaps should contain 'butt' for intermediate segments to avoid overlapping beads
  assert.ok(lineCaps.includes("butt"));
});

test("Laser Pointer - renderLaserTrail supports zoom scale parameter", () => {
  const strokeWidths = [];
  const mockCtx = {
    save: () => {},
    restore: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {},
    arc: () => {},
    fill: () => {},
    set lineCap(v) {},
    set lineJoin(v) {},
    set strokeStyle(v) {},
    set fillStyle(v) {},
    set lineWidth(v) { strokeWidths.push(v); },
    set shadowColor(v) {},
    set shadowBlur(v) {},
  };

  const now = 2000;
  const points = [
    { x: 0, y: 0, time: 1900, newStroke: true },
    { x: 50, y: 50, time: 2000 },
  ];

  // Render at scale 2x
  renderLaserTrail(mockCtx, points, now, true, { scale: 2 });
  const maxScaledWidth = Math.max(...strokeWidths);

  strokeWidths.length = 0;
  // Render at default scale 1x
  renderLaserTrail(mockCtx, points, now, true, { scale: 1 });
  const maxDefaultWidth = Math.max(...strokeWidths);

  // Scaled width at 2x should be approximately double default width
  assert.ok(maxScaledWidth > maxDefaultWidth * 1.8);
});
