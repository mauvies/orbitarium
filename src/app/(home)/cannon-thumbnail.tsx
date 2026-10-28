import { circularSpeed, EARTH_RADIUS, traceLaunch } from "@/cannon";
import { Plate, plateUnitsPerPixel } from "@/components/plate";
import { boundsOf, svgFrame, svgOpenPathData } from "@/drawing/orbit-path";
import type { Vec2 } from "@/physics";

/** A much taller mountain than the lesson's, as in Newton's own drawing. */
const LAUNCH_POINT: Vec2 = { x: 0, y: 1.35 };
// Three shots that fall back ever farther and one that circles, as fractions
// of the circular speed.
const SHOT_SPEEDS = [0.55, 0.75, 0.9, 1] as const;
// None of the shots rises above the cannon.
const STOP_RADIUS = 2 * LAUNCH_POINT.y;
// The paths are smooth, so one point in ten is enough at plate size.
const POINT_STRIDE = 10;
const CANNON_DOT_RADIUS_PX = 2.5;

interface Props {
  className?: string;
}

/** Newton's cannon, computed with the physics engine when the page is built. */
export function CannonThumbnail({ className }: Props) {
  const shots = SHOT_SPEEDS.map((fraction) =>
    everyNthPoint(shotPath(fraction * circularSpeed(LAUNCH_POINT.y))),
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

function shotPath(speed: number): readonly Vec2[] {
  const launch = { position: LAUNCH_POINT, velocity: { x: speed, y: 0 } };

  return traceLaunch(launch, { stopRadius: STOP_RADIUS }).points;
}

function everyNthPoint<T>(points: readonly T[]): readonly T[] {
  return points.filter(
    (_, i) => i % POINT_STRIDE === 0 || i === points.length - 1,
  );
}
