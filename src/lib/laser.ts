export interface LaserPoint {
  x: number;
  y: number;
  time: number;
  newStroke?: boolean;
}

export interface LaserSamplePoint {
  x: number;
  y: number;
  time: number;
}

export interface LaserConfig {
  lifespanMs: number;
  maxOuterWidth: number;
  minOuterWidth: number;
  maxCoreWidth: number;
  minCoreWidth: number;
  glowColor: string; // RGB values "244, 63, 94"
  coreColor: string; // RGB values "255, 255, 255"
  tipRadius: number;
  tipGlowRadius: number;
  tipCoreRadius: number;
  scale?: number;
}

export const DEFAULT_LASER_CONFIG: LaserConfig = {
  lifespanMs: 1200,
  maxOuterWidth: 10,
  minOuterWidth: 2,
  maxCoreWidth: 4,
  minCoreWidth: 1,
  glowColor: "255, 25, 65", // Rich, ultra-vibrant neon laser crimson
  coreColor: "255, 140, 160", // Radiant luminous highlight (warm, high-contrast)
  tipRadius: 6,
  tipGlowRadius: 13,
  tipCoreRadius: 2.8,
  scale: 1,
};

/**
 * Filters out laser points older than the decay lifespan.
 * When `keepPredecessor` is true, preserves 1 expired predecessor point from the active stroke
 * to maintain tangent and curvature continuity so the decaying comet tail does not jump.
 */
export function pruneLaserPoints(
  points: LaserPoint[],
  now: number,
  lifespanMs: number = DEFAULT_LASER_CONFIG.lifespanMs,
  keepPredecessor = false
): LaserPoint[] {
  if (!points || points.length === 0) return [];
  if (!keepPredecessor) {
    return points.filter((p) => now - p.time < lifespanMs);
  }

  const firstValidIdx = points.findIndex((p) => now - p.time < lifespanMs);
  if (firstValidIdx === -1) {
    return [];
  }
  const startIdx =
    firstValidIdx > 0 && !points[firstValidIdx].newStroke
      ? firstValidIdx - 1
      : firstValidIdx;
  return points.slice(startIdx);
}

/**
 * Calculates normalized lifecycle progress from 0 (expired tail) to 1 (newest tip).
 */
export function calculateLaserProgress(
  pointTime: number,
  now: number,
  lifespanMs: number = DEFAULT_LASER_CONFIG.lifespanMs
): number {
  const age = now - pointTime;
  if (age <= 0) return 1;
  if (age >= lifespanMs) return 0;
  return 1 - age / lifespanMs;
}

/**
 * Smooth progressive opacity decay curve.
 */
export function calculateLaserAlpha(progress: number): number {
  const clamped = Math.max(0, Math.min(1, progress));
  if (clamped <= 0) return 0;
  if (clamped >= 1) return 1;
  return Math.min(1, Math.pow(clamped, 0.75));
}

/**
 * Stroke width tapering from tip (progress = 1) down towards tail (progress = 0).
 */
export function calculateLaserWidth(
  progress: number,
  maxWidth: number,
  minWidth: number
): number {
  const clamped = Math.max(0, Math.min(1, progress));
  return minWidth + (maxWidth - minWidth) * Math.pow(clamped, 0.85);
}

/**
 * Subdivides and smooths points using midpoint quadratic Bézier curve interpolation.
 * Ensures silky-smooth curves for both slow and high-speed cursor gestures.
 */
export function createSmoothLaserPath(
  points: LaserPoint[],
  maxSegmentLength = 8
): LaserSamplePoint[] {
  if (!points || points.length === 0) return [];
  if (points.length === 1) {
    return [{ x: points[0].x, y: points[0].y, time: points[0].time }];
  }
  if (points.length === 2) {
    const p0 = points[0];
    const p1 = points[1];
    const dist = Math.hypot(p1.x - p0.x, p1.y - p0.y);
    const steps = Math.max(2, Math.min(48, Math.ceil(dist / maxSegmentLength)));
    const samples: LaserSamplePoint[] = [];
    for (let s = 0; s <= steps; s++) {
      const u = s / steps;
      samples.push({
        x: p0.x + (p1.x - p0.x) * u,
        y: p0.y + (p1.y - p0.y) * u,
        time: p0.time + (p1.time - p0.time) * u,
      });
    }
    return samples;
  }

  // 3 or more points: Exact tangent-continuous quadratic midpoint Bézier spline
  const samples: LaserSamplePoint[] = [];
  const n = points.length;

  let currentStart = { x: points[0].x, y: points[0].y, time: points[0].time };
  samples.push(currentStart);

  for (let i = 1; i < n - 1; i++) {
    const cX = points[i].x;
    const cY = points[i].y;
    const cTime = points[i].time;
    const eX = (points[i].x + points[i + 1].x) / 2;
    const eY = (points[i].y + points[i + 1].y) / 2;
    const eTime = (points[i].time + points[i + 1].time) / 2;

    const sX = currentStart.x;
    const sY = currentStart.y;
    const sTime = currentStart.time;

    const chord = Math.hypot(cX - sX, cY - sY) + Math.hypot(eX - cX, eY - cY);
    const steps = Math.max(2, Math.min(48, Math.ceil(chord / maxSegmentLength)));

    for (let step = 1; step <= steps; step++) {
      const u = step / steps;
      const invU = 1 - u;
      const x = invU * invU * sX + 2 * invU * u * cX + u * u * eX;
      const y = invU * invU * sY + 2 * invU * u * cY + u * u * eY;
      const time = invU * invU * sTime + 2 * invU * u * cTime + u * u * eTime;
      samples.push({ x, y, time });
    }

    currentStart = { x: eX, y: eY, time: eTime };
  }

  // Final segment from currentStart (last midpoint) to points[n - 1]
  const lastPoint = points[n - 1];
  const sX = currentStart.x;
  const sY = currentStart.y;
  const sTime = currentStart.time;
  const eX = lastPoint.x;
  const eY = lastPoint.y;
  const eTime = lastPoint.time;

  const finalDist = Math.hypot(eX - sX, eY - sY);
  const finalSteps = Math.max(2, Math.min(48, Math.ceil(finalDist / maxSegmentLength)));

  for (let step = 1; step <= finalSteps; step++) {
    const u = step / finalSteps;
    const x = sX + (eX - sX) * u;
    const y = sY + (eY - sY) * u;
    const time = sTime + (eTime - sTime) * u;
    samples.push({ x, y, time });
  }

  return samples;
}

/**
 * Groups a sequence of points into distinct strokes separated by `newStroke` markers.
 */
export function groupLaserStrokes(points: LaserPoint[]): LaserPoint[][] {
  const strokes: LaserPoint[][] = [];
  let current: LaserPoint[] = [];

  for (const p of points) {
    if (p.newStroke && current.length > 0) {
      strokes.push(current);
      current = [];
    }
    current.push(p);
  }

  if (current.length > 0) {
    strokes.push(current);
  }

  return strokes;
}

/**
 * Renders the glowing laser pointer trail and tip onto the 2D canvas context.
 */
export function renderLaserTrail(
  ctx: CanvasRenderingContext2D,
  points: LaserPoint[],
  now: number,
  isPointerDown: boolean,
  customConfig?: Partial<LaserConfig>
): void {
  if (!points || points.length === 0) return;

  const cfg: LaserConfig = {
    ...DEFAULT_LASER_CONFIG,
    ...customConfig,
  };

  const scale = cfg.scale ?? 1;
  const strokes = groupLaserStrokes(points);
  if (strokes.length === 0) return;

  ctx.save();
  ctx.lineJoin = "round";

  strokes.forEach((stroke, strokeIdx) => {
    // Retain up to 1 predecessor point from the stroke for stable curve rendering
    const validPoints = pruneLaserPoints(stroke, now, cfg.lifespanMs, true);
    if (validPoints.length === 0) return;

    const samples = createSmoothLaserPath(validPoints);
    const isTipActive = isPointerDown && strokeIdx === strokes.length - 1;

    // Filter samples that have remaining lifespan (progress > 0)
    const activeSamples = samples.filter(
      (s) => calculateLaserProgress(s.time, now, cfg.lifespanMs) > 0
    );
    if (activeSamples.length === 0 && !isTipActive) return;

    const renderSamples = activeSamples.length >= 2 ? activeSamples : samples;

    // Pass 1: Outer glowing neon bloom
    if (renderSamples.length >= 2) {
      ctx.shadowColor = `rgb(${cfg.glowColor})`;
      for (let i = 1; i < renderSamples.length; i++) {
        const p1 = renderSamples[i - 1];
        const p2 = renderSamples[i];
        const midTime = (p1.time + p2.time) / 2;
        const progress = calculateLaserProgress(midTime, now, cfg.lifespanMs);
        if (progress <= 0) continue;

        const alpha = calculateLaserAlpha(progress);
        const width = calculateLaserWidth(
          progress,
          cfg.maxOuterWidth * scale,
          cfg.minOuterWidth * scale
        );

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(${cfg.glowColor}, ${Math.min(1, alpha * 0.95)})`;
        ctx.lineWidth = width;
        ctx.lineCap = i === 1 ? "round" : "butt";
        ctx.shadowBlur = (10 * progress + 4) * scale;
        ctx.stroke();
      }

      ctx.shadowBlur = 0;

      // Pass 2: Inner intense radiant core
      for (let i = 1; i < renderSamples.length; i++) {
        const p1 = renderSamples[i - 1];
        const p2 = renderSamples[i];
        const midTime = (p1.time + p2.time) / 2;
        const progress = calculateLaserProgress(midTime, now, cfg.lifespanMs);
        if (progress <= 0) continue;

        const alpha = calculateLaserAlpha(progress);
        const width = calculateLaserWidth(
          progress,
          cfg.maxCoreWidth * scale,
          cfg.minCoreWidth * scale
        );

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(${cfg.coreColor}, ${Math.min(1, alpha * 0.95)})`;
        ctx.lineWidth = width;
        ctx.lineCap = i === 1 ? "round" : "butt";
        ctx.stroke();
      }
    }

    // Pass 3: Vivid Glowing Tip Dot
    const tipPoint = stroke[stroke.length - 1];
    const tipProgress = isTipActive
      ? 1
      : calculateLaserProgress(tipPoint.time, now, cfg.lifespanMs);
    const tipAlpha = calculateLaserAlpha(tipProgress);

    if (tipAlpha > 0.01) {
      // Outer halo
      ctx.beginPath();
      ctx.arc(tipPoint.x, tipPoint.y, cfg.tipGlowRadius * scale * tipProgress, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${cfg.glowColor}, ${Math.min(1, tipAlpha * 0.45)})`;
      ctx.shadowColor = `rgb(${cfg.glowColor})`;
      ctx.shadowBlur = 16 * scale * tipProgress;
      ctx.fill();

      // Middle crimson disk (solid laser red)
      ctx.beginPath();
      ctx.arc(tipPoint.x, tipPoint.y, cfg.tipRadius * scale * tipProgress, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${cfg.glowColor}, ${Math.min(1, tipAlpha * 1.0)})`;
      ctx.shadowBlur = 0;
      ctx.fill();

      // Inner hot spark
      ctx.beginPath();
      ctx.arc(
        tipPoint.x,
        tipPoint.y,
        Math.max(1 * scale, cfg.tipCoreRadius * scale * tipProgress),
        0,
        Math.PI * 2
      );
      ctx.fillStyle = `rgba(${cfg.coreColor}, ${tipAlpha})`;
      ctx.fill();
    }
  });

  ctx.restore();
}
