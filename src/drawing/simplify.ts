import type { Vec2 } from "@/physics";

/**
 * The points of a closed path that keep every point of it within `tolerance`
 * of the simplified path (Ramer–Douglas–Peucker), starting at the first point
 * and in the input order. The path closes from its last point to its first.
 */
export function simplifyClosedPath(
  points: readonly Vec2[],
  tolerance: number,
): readonly Vec2[] {
  validate(points, tolerance);
  // Closing the loop on the first point lets the open algorithm handle it.
  const loop = [...points, pointAt(points, 0)];
  const kept = new Set([0, loop.length - 1]);
  const pending = [{ start: 0, end: loop.length - 1 }];

  for (let span = pending.pop(); span !== undefined; span = pending.pop()) {
    const farthest = farthestBetween(loop, span.start, span.end);

    if (farthest.distance > tolerance) {
      kept.add(farthest.index);

      pending.push(
        { start: span.start, end: farthest.index },
        { start: farthest.index, end: span.end },
      );
    }
  }

  return points.filter((_, i) => kept.has(i));
}

function farthestBetween(
  points: readonly Vec2[],
  start: number,
  end: number,
): { index: number; distance: number } {
  let farthest = { index: start, distance: 0 };

  for (let i = start + 1; i < end; i++) {
    const distance = distanceToSegment(
      pointAt(points, i),
      pointAt(points, start),
      pointAt(points, end),
    );

    if (distance > farthest.distance) {
      farthest = { index: i, distance };
    }
  }

  return farthest;
}

function distanceToSegment(point: Vec2, start: Vec2, end: Vec2): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;

  // A segment of zero length (the closing one) is a point.
  const along =
    lengthSquared === 0
      ? 0
      : ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared;

  const t = Math.min(1, Math.max(0, along));

  return Math.hypot(point.x - (start.x + t * dx), point.y - (start.y + t * dy));
}

function pointAt(points: readonly Vec2[], index: number): Vec2 {
  const point = points[index];

  if (point === undefined) {
    throw new RangeError(`points[${index}] is missing`);
  }

  return point;
}

function validate(points: readonly Vec2[], tolerance: number): void {
  if (points.length < 2) {
    throw new RangeError(
      `points must hold at least 2 points, got ${points.length}`,
    );
  }

  if (!(Number.isFinite(tolerance) && tolerance > 0)) {
    throw new RangeError(
      `tolerance must be a positive finite number, got ${tolerance}`,
    );
  }
}
