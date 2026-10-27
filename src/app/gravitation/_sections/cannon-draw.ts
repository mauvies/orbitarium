import { EARTH_RADIUS, LAUNCH_RADIUS } from "@/cannon";
import { type CanvasTransform, toCanvas } from "@/drawing/transform";
import type { Vec2 } from "@/physics";

// In CSS pixels. The mountain is exaggerated: drawn to scale, 10 km would be
// a quarter of a pixel (spec 04, Decision 8).
const EARTH_EDGE_WIDTH_PX = 1;
const MOUNTAIN_HEIGHT_PX = 8;
const MOUNTAIN_HALF_WIDTH_PX = 5;
const PATH_WIDTH_PX = 2;
const SHOT_RADIUS_PX = 3.5;
// Spec 04, Decision 11: earlier paths stay faint, like the gallery's path
// (spec 03, Decision 6).
const EARLIER_PATH_ALPHA = 0.3;

export function drawEarth(
  context: CanvasRenderingContext2D,
  transform: CanvasTransform,
  { fill, edge }: { readonly fill: string; readonly edge: string },
): void {
  const centre = toCanvas({ x: 0, y: 0 }, transform);
  context.beginPath();
  context.arc(
    centre.x,
    centre.y,
    EARTH_RADIUS * transform.scale,
    0,
    2 * Math.PI,
  );
  context.closePath();
  context.fillStyle = fill;
  context.fill();
  context.strokeStyle = edge;
  context.lineWidth = EARTH_EDGE_WIDTH_PX;
  // Set here, and the circle closed so it has no caps: otherwise the edge
  // would take the last path's style and change once a shot is drawn.
  context.lineJoin = "round";
  context.stroke();
}

/** The cannon's mountain, rising from the launch point at the top of the Earth. */
export function drawMountain(
  context: CanvasRenderingContext2D,
  transform: CanvasTransform,
  color: string,
): void {
  const foot = toCanvas({ x: 0, y: LAUNCH_RADIUS }, transform);
  context.beginPath();
  context.moveTo(foot.x - MOUNTAIN_HALF_WIDTH_PX, foot.y);
  context.lineTo(foot.x, foot.y - MOUNTAIN_HEIGHT_PX);
  context.lineTo(foot.x + MOUNTAIN_HALF_WIDTH_PX, foot.y);
  context.closePath();
  context.fillStyle = color;
  context.fill();
}

/** The first `count` points of the shot's path. */
export function drawShotPath(
  context: CanvasRenderingContext2D,
  points: readonly Vec2[],
  count: number,
  transform: CanvasTransform,
  color: string,
): void {
  strokePath(context, points.slice(0, count), transform, color);
}

/** An earlier launch's whole path, faint, to compare with the current one. */
export function drawEarlierPath(
  context: CanvasRenderingContext2D,
  points: readonly Vec2[],
  transform: CanvasTransform,
  color: string,
): void {
  context.globalAlpha = EARLIER_PATH_ALPHA;
  strokePath(context, points, transform, color);
  context.globalAlpha = 1;
}

export function drawShot(
  context: CanvasRenderingContext2D,
  position: Vec2,
  transform: CanvasTransform,
  color: string,
): void {
  const { x, y } = toCanvas(position, transform);
  context.beginPath();
  context.arc(x, y, SHOT_RADIUS_PX, 0, 2 * Math.PI);
  context.fillStyle = color;
  context.fill();
}

function strokePath(
  context: CanvasRenderingContext2D,
  points: readonly Vec2[],
  transform: CanvasTransform,
  color: string,
): void {
  if (points.length < 2) {
    return;
  }
  context.beginPath();
  for (const [i, point] of points.entries()) {
    const { x, y } = toCanvas(point, transform);
    if (i === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  }
  context.strokeStyle = color;
  context.lineWidth = PATH_WIDTH_PX;
  context.lineJoin = "round";
  context.lineCap = "round";
  context.stroke();
}
