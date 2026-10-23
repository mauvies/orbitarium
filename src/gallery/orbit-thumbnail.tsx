import type { OrbitPreset } from "@/orbits";
import { orbitPath, svgFrame, svgPathData } from "./orbit-path";

// The widest a thumbnail is drawn: one of two cards at 768 px (spec 03, G9).
const THUMBNAIL_SIZE_PX = 360;

/**
 * The orbit's path as a static SVG, traced when the page is built (spec 03,
 * Decision 4). Decorative: the card's text names the orbit.
 */
export function OrbitThumbnail({ orbit }: { orbit: OrbitPreset }) {
  const path = orbitPath(orbit, THUMBNAIL_SIZE_PX);
  const { x, y, width, height } = svgFrame(path.bounds);
  return (
    <svg
      viewBox={`${x} ${y} ${width} ${height}`}
      className="aspect-4/3 w-full"
      aria-hidden="true"
    >
      <path
        d={path.bodies.map(svgPathData).join("")}
        className="fill-none stroke-accent"
        strokeWidth={1.5}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
