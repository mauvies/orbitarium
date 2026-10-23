import { Plate, plateUnitsPerPixel } from "@/components/plate";
import { boundsOf, svgFrame, svgOpenPathData } from "@/drawing/orbit-path";
import {
  cannonTrajectory,
  circularSpeed,
  EARTH_RADIUS,
  LAUNCH_POINT,
} from "./newton-cannon";

// Three shots that fall back ever farther and one that circles, as fractions
// of the circular speed.
const SHOT_SPEEDS = [0.55, 0.75, 0.9, 1] as const;
// The paths are smooth, so one point in ten is enough at plate size.
const POINT_STRIDE = 10;
const CANNON_DOT_RADIUS_PX = 2.5;

/** Newton's cannon, computed with the physics engine when the page is built. */
export function CannonThumbnail({ className }: { className?: string }) {
  const shots = SHOT_SPEEDS.map((fraction) =>
    everyNthPoint(cannonTrajectory(fraction * circularSpeed)),
  );
  const frame = svgFrame(
    boundsOf([
      ...shots.flat(),
      { x: -EARTH_RADIUS, y: -EARTH_RADIUS },
      { x: EARTH_RADIUS, y: EARTH_RADIUS },
    ]),
  );
  const unitsPerPixel = plateUnitsPerPixel(frame, "beside-text");
  return (
    <Plate frame={frame} shape="beside-text" className={className}>
      <path
        d={shots.map(svgOpenPathData).join("")}
        className="fill-none stroke-accent opacity-85 group-focus-within:opacity-100 group-hover:opacity-100 motion-safe:transition-opacity"
        strokeWidth={1.25}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {/* Drawn after the shots, so the falling ones end at the surface. */}
      <circle
        r={EARTH_RADIUS}
        className="fill-surface-raised stroke-line"
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx={LAUNCH_POINT.x}
        cy={-LAUNCH_POINT.y}
        r={CANNON_DOT_RADIUS_PX * unitsPerPixel}
        className="fill-strong"
      />
    </Plate>
  );
}

function everyNthPoint<T>(points: readonly T[]): readonly T[] {
  return points.filter(
    (_, i) => i % POINT_STRIDE === 0 || i === points.length - 1,
  );
}
