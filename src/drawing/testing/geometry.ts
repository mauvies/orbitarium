import type { Vec2 } from "@/physics";

/** The largest distance from any of `points` to the closed path. */
export function largestDistanceToClosedPath(
  points: readonly Vec2[],
  path: readonly Vec2[],
): number {
  return Math.max(...points.map((point) => distanceToClosedPath(point, path)));
}

/** The distance from `point` to the closed path through `path`'s points. */
function distanceToClosedPath(point: Vec2, path: readonly Vec2[]): number {
  return path.reduce((nearest, start, i) => {
    const end = path[(i + 1) % path.length] ?? start;

    return Math.min(nearest, distanceToSegment(point, start, end));
  }, Number.POSITIVE_INFINITY);
}

function distanceToSegment(point: Vec2, start: Vec2, end: Vec2): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;

  const along =
    lengthSquared === 0
      ? 0
      : ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared;

  const t = Math.min(1, Math.max(0, along));

  return Math.hypot(point.x - (start.x + t * dx), point.y - (start.y + t * dy));
}
