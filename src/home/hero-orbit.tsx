import {
  orbitPath,
  svgFrame,
  svgPathData,
  svgUnitsPerPixel,
} from "@/gallery/orbit-path";
import { getOrbit } from "@/orbits";

// The hero is at most this wide (beside the title on a wide screen, capped
// below it), so its line stays close to 1.5 px at every width.
const HERO_WIDTH_PX = 480;
const LINE_WIDTH_PX = 1.5;
const BODY_DOT_RADIUS_PX = 4;

/**
 * The figure-eight, drawn from its traced path: it draws itself once, then
 * its three bodies appear at their starting points (docs/design/
 * visual-style.md, "Motion"). With reduced motion it is shown finished.
 */
export function HeroOrbit() {
  const orbit = getOrbit("figure-eight");
  if (orbit === undefined) {
    throw new RangeError('no orbit with slug "figure-eight"');
  }
  const path = orbitPath(orbit, HERO_WIDTH_PX);
  // The three bodies share one curve, so one body's path draws all of it.
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
