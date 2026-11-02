import {
  orbitPath,
  svgFrame,
  svgPathData,
  svgUnitsPerPixel,
} from "@/drawing/orbit-path";
import { orbitOf } from "@/orbits";

const HERO_WIDTH_PX = 480;
const LINE_WIDTH_PX = 1.5;
const BODY_DOT_RADIUS_PX = 4;

export function HeroOrbit() {
  const orbit = orbitOf("figure-eight");
  const path = orbitPath(orbit, HERO_WIDTH_PX);
  const curve = path.bodies[0];

  if (curve === undefined) {
    throw new RangeError("the figure-eight has no bodies");
  }

  const frame = svgFrame(path.bounds);

  const unitsPerPixel = svgUnitsPerPixel(
    frame,
    HERO_WIDTH_PX,
    (HERO_WIDTH_PX * frame.height) / frame.width,
  );

  return (
    <svg
      viewBox={`${frame.x} ${frame.y} ${frame.width} ${frame.height}`}
      className="w-full max-w-120"
      aria-hidden="true"
    >
      {/* pathLength 1 makes the dash that draws the curve its whole length. */}
      <path
        d={svgPathData(curve)}
        pathLength={1}
        strokeDasharray={1}
        className="fill-none stroke-accent motion-safe:animate-draw"
        strokeWidth={LINE_WIDTH_PX * unitsPerPixel}
        strokeLinejoin="round"
      />
      {orbit.initialState.bodies.map(({ position: { x, y } }) => (
        <circle
          key={`${x} ${y}`}
          cx={x}
          cy={-y}
          r={BODY_DOT_RADIUS_PX * unitsPerPixel}
          className="fill-strong motion-safe:animate-appear"
        />
      ))}
    </svg>
  );
}
