import { EARTH_RADIUS } from "@/cannon";
import { type CanvasTransform, toCanvas } from "@/drawing/transform";
import type { Vec2 } from "@/physics";

// In CSS pixels. The mountain is drawn to scale, but never lower than 3 px:
// 10 km would be a fifth of a pixel, and on a 640 px canvas it grows from
// about 180 km (spec 04, Decision 8).
const EARTH_EDGE_WIDTH_PX = 1;
const MOUNTAIN_MIN_HEIGHT_PX = 3;
// A base 1.25 times as wide as the mountain is high, at any height.
const MOUNTAIN_HALF_WIDTH_PER_HEIGHT = 0.625;
const PATH_WIDTH_PX = 2;
const SHOT_RADIUS_PX = 3.5;
// Spec 04, Decision 11: earlier paths stay faint and thin, under the
// current one.
const EARLIER_PATH_ALPHA = 0.2;
const EARLIER_PATH_WIDTH_PX = 1;
// Spec 04, Decision 11: the predicted path is dashed, so it reads as a
// forecast and not as a shot.
const PREDICTED_PATH_WIDTH_PX = 1.5;
const PREDICTED_PATH_DASH_PX = [6, 4];

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

/**
 * The cannon's mountain, on top of the Earth, up to the launch point
 * `launchRadius` from the centre.
 */
export function drawMountain(
  context: CanvasRenderingContext2D,
  transform: CanvasTransform,
  launchRadius: number,
  color: string,
): void {
  const top = toCanvas({ x: 0, y: EARTH_RADIUS }, transform);
  const height = Math.max(
    MOUNTAIN_MIN_HEIGHT_PX,
    (launchRadius - EARTH_RADIUS) * transform.scale,
  );
  const halfWidth = height * MOUNTAIN_HALF_WIDTH_PER_HEIGHT;
  // The base sinks as far as the Earth curves away under its corners, so a
  // wide mountain still stands on the ground.
  const sag = (halfWidth * halfWidth) / (2 * EARTH_RADIUS * transform.scale);
  context.beginPath();
  context.moveTo(top.x - halfWidth, top.y + sag);
  context.lineTo(top.x, top.y - height);
  context.lineTo(top.x + halfWidth, top.y + sag);
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
  strokePath(context, points.slice(0, count), transform, {
    color,
    width: PATH_WIDTH_PX,
  });
}

/** An earlier launch's whole path, faint, to compare with the current one. */
export function drawEarlierPath(
  context: CanvasRenderingContext2D,
  points: readonly Vec2[],
  transform: CanvasTransform,
  color: string,
): void {
  context.globalAlpha = EARLIER_PATH_ALPHA;
  strokePath(context, points, transform, {
    color,
    width: EARLIER_PATH_WIDTH_PX,
  });
  context.globalAlpha = 1;
}

/** The path the current settings would give, dashed, before any launch. */
export function drawPredictedPath(
  context: CanvasRenderingContext2D,
  points: readonly Vec2[],
  transform: CanvasTransform,
  color: string,
): void {
  context.save();
  context.setLineDash(PREDICTED_PATH_DASH_PX);
  strokePath(context, points, transform, {
    color,
    width: PREDICTED_PATH_WIDTH_PX,
  });
  context.restore();
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
  { color, width }: { readonly color: string; readonly width: number },
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
  context.lineWidth = width;
  context.lineJoin = "round";
  context.lineCap = "round";
  context.stroke();
}
