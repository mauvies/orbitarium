import type { Bounds } from "@/canvas/transform";
import { type OrbitPreset, tracePeriod } from "@/orbits";
import type { Vec2 } from "@/physics";
import { simplifyClosedPath } from "./simplify";

// Spec 03, Decision 4. Time-uniform samples are sparse at close encounters,
// so the period is traced densely and then simplified to what the drawing
// needs. Every ladder value is either below 10,000 or a multiple of it, so
// the points always divide stepsPerPeriod.
const MAX_TRACE_POINTS = 10_000;
const PIXEL_TOLERANCE = 0.25;

/** 1e-4: under 0.03 px for the widest orbit on a 640 px canvas. */
export const COORDINATE_DECIMALS = 4;

/** Space around the orbit in a picture, as a fraction of its larger side. */
const FRAME_MARGIN = 0.05;

export type OrbitPath = {
  /** Each body's closed path over one period, starting at its initial position. */
  readonly bodies: readonly (readonly Vec2[])[];
  readonly bounds: Bounds;
};

/** One period of the orbit, simplified for a drawing `sizePx` pixels wide. */
export function orbitPath(orbit: OrbitPreset, sizePx: number): OrbitPath {
  if (!(Number.isFinite(sizePx) && sizePx > 0)) {
    throw new RangeError(
      `sizePx must be a positive finite number, got ${sizePx}`,
    );
  }
  const trace = tracePeriod(
    orbit,
    Math.min(orbit.stepsPerPeriod, MAX_TRACE_POINTS),
  );
  const bounds = boundsOf(trace.flat());
  const tolerance = (PIXEL_TOLERANCE * largerSide(bounds)) / sizePx;
  return {
    bodies: trace.map((body) =>
      simplifyClosedPath(body, tolerance).map(roundPoint),
    ),
    bounds,
  };
}

/** SVG path data for a closed path, with y flipped so that up stays up. */
export function svgPathData(points: readonly Vec2[]): string {
  return `${svgOpenPathData(points)}Z`;
}

/** SVG path data for a path that does not return to its start. */
export function svgOpenPathData(points: readonly Vec2[]): string {
  return points
    .map(({ x, y }, i) => `${i === 0 ? "M" : "L"}${x} ${-y}`)
    .join("");
}

export type SvgFrame = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

/** The SVG view box that frames `bounds`, in svgPathData's flipped coordinates. */
export function svgFrame(bounds: Bounds): SvgFrame {
  const margin = FRAME_MARGIN * largerSide(bounds);
  return {
    x: bounds.minX - margin,
    y: -bounds.maxY - margin,
    width: bounds.maxX - bounds.minX + 2 * margin,
    height: bounds.maxY - bounds.minY + 2 * margin,
  };
}

/**
 * View box units per pixel when `frame` is fitted, whole and centred, into a
 * picture `widthPx` by `heightPx`: for sizes that must not scale, like dots.
 */
export function svgUnitsPerPixel(
  frame: SvgFrame,
  widthPx: number,
  heightPx: number,
): number {
  return Math.max(frame.width / widthPx, frame.height / heightPx);
}

export function boundsOf(points: readonly Vec2[]): Bounds {
  const xs = points.map(({ x }) => x);
  const ys = points.map(({ y }) => y);
  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  };
}

function largerSide({ minX, minY, maxX, maxY }: Bounds): number {
  return Math.max(maxX - minX, maxY - minY);
}

function roundPoint({ x, y }: Vec2): Vec2 {
  const scale = 10 ** COORDINATE_DECIMALS;
  return { x: Math.round(x * scale) / scale, y: Math.round(y * scale) / scale };
}
