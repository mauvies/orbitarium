import {
  PLATE_WIDTH_PX,
  Plate,
  type PlateShape,
  plateUnitsPerPixel,
} from "@/components/plate";
import { orbitPath, svgFrame, svgPathData } from "@/drawing/orbit-path";
import type { OrbitPreset } from "@/orbits";

const START_DOT_RADIUS_PX = 2;

interface Props {
  orbit: OrbitPreset;
  shape?: PlateShape;
  className?: string;
}

/**
 * The orbit's path on a plate, as a static SVG traced when the page is built
 * (spec 03, Decision 4), with the bodies' starting points.
 */
export function OrbitThumbnail({ orbit, shape = "wide", className }: Props) {
  const path = orbitPath(orbit, PLATE_WIDTH_PX);
  const frame = svgFrame(path.bounds);
  const dotRadius = START_DOT_RADIUS_PX * plateUnitsPerPixel(frame, shape);

  return (
    <Plate frame={frame} shape={shape} className={className}>
      <path
        d={path.bodies.map(svgPathData).join("")}
        className="fill-none stroke-accent opacity-85 group-focus-within:opacity-100 group-hover:opacity-100 motion-safe:transition-opacity"
        strokeWidth={1.25}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {orbit.initialState.bodies.map(({ position: { x, y } }) => (
        <circle
          key={`${x} ${y}`}
          cx={x}
          cy={-y}
          r={dotRadius}
          className="fill-strong"
        />
      ))}
    </Plate>
  );
}
