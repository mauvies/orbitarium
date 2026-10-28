import { type CanvasTransform, toCanvas } from "@/drawing/transform";
import type { Vec2 } from "@/physics";
import type { Trail, TrailSample } from "./trail";

// Spec 03, Decision 6: the path faint, the trail bright, in CSS pixels.
const PATH_ALPHA = 0.3;
const PATH_WIDTH_PX = 1;
const TRAIL_WIDTH_PX = 2;
const TRAIL_FADE_STEPS = 10;
const BODY_RADIUS_PX = 4;

/** Each body's closed path, in canvas pixels, ready to stroke. */
export function pathShape(
  bodies: readonly (readonly Vec2[])[],
  transform: CanvasTransform,
): Path2D {
  const shape = new Path2D();

  for (const body of bodies) {
    for (const [i, point] of body.entries()) {
      const { x, y } = toCanvas(point, transform);

      if (i === 0) {
        shape.moveTo(x, y);
      } else {
        shape.lineTo(x, y);
      }
    }

    shape.closePath();
  }

  return shape;
}

export function drawPath(
  context: CanvasRenderingContext2D,
  shape: Path2D,
  color: string,
): void {
  context.globalAlpha = PATH_ALPHA;
  context.strokeStyle = color;
  context.lineWidth = PATH_WIDTH_PX;
  context.lineJoin = "round";
  context.stroke(shape);
  context.globalAlpha = 1;
}

/** Each body's trail, fading from transparent at its oldest end. */
export function drawTrail(
  context: CanvasRenderingContext2D,
  trail: Trail,
  transform: CanvasTransform,
  color: string,
): void {
  const bodyCount = trail.at(-1)?.positions.length ?? 0;

  context.strokeStyle = color;
  context.lineWidth = TRAIL_WIDTH_PX;
  context.lineJoin = "round";
  context.lineCap = "round";

  for (let body = 0; body < bodyCount; body++) {
    const points = trail.map((sample) =>
      toCanvas(positionOf(sample, body), transform),
    );

    const last = points.length - 1;

    // Each step overlaps the next by one point, so the line has no gaps.
    for (let step = 0; step < TRAIL_FADE_STEPS; step++) {
      const start = Math.floor((step * last) / TRAIL_FADE_STEPS);
      const end = Math.floor(((step + 1) * last) / TRAIL_FADE_STEPS);

      context.globalAlpha = (step + 1) / TRAIL_FADE_STEPS;
      strokePolyline(context, points.slice(start, end + 1));
    }
  }

  context.globalAlpha = 1;
}

export function drawBodies(
  context: CanvasRenderingContext2D,
  positions: readonly Vec2[],
  transform: CanvasTransform,
  color: string,
): void {
  context.fillStyle = color;

  for (const position of positions) {
    const { x, y } = toCanvas(position, transform);

    context.beginPath();
    context.arc(x, y, BODY_RADIUS_PX, 0, 2 * Math.PI);
    context.fill();
  }
}

function strokePolyline(
  context: CanvasRenderingContext2D,
  points: readonly Vec2[],
): void {
  if (points.length < 2) {
    return;
  }

  context.beginPath();

  for (const [i, { x, y }] of points.entries()) {
    if (i === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  }

  context.stroke();
}

function positionOf(sample: TrailSample, body: number): Vec2 {
  const position = sample.positions[body];

  if (position === undefined) {
    throw new RangeError(
      `trail sample at time ${sample.time} has no position for body ${body}`,
    );
  }

  return position;
}
