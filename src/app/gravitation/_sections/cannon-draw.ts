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
  context.fillStyle = fill;
  context.fill();
  context.strokeStyle = edge;
  context.lineWidth = EARTH_EDGE_WIDTH_PX;
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
  if (count < 2) {
    return;
  }
  context.beginPath();
  for (const [i, point] of points.slice(0, count).entries()) {
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
