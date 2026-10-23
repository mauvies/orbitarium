import { describe, expect, it } from "vitest";
import { tracePeriod } from "@/orbits";
import { presetOf } from "@/orbits/testing/support";
import {
  COORDINATE_DECIMALS,
  orbitPath,
  svgFrame,
  svgOpenPathData,
  svgPathData,
  svgUnitsPerPixel,
} from "./orbit-path";
import { largestDistanceToClosedPath } from "./testing/support";

// Spec 03, Decision 4: simplified to a quarter of a pixel at the drawn size.
const PIXEL_TOLERANCE = 0.25;
const DETAIL_SIZE_PX = 640;
const THUMBNAIL_SIZE_PX = 160;
// Rounding each coordinate moves a point by at most half a step on each axis.
const ROUNDING_ERROR = Math.SQRT1_2 * 10 ** -COORDINATE_DECIMALS;

// The traces of these two cost milliseconds; the others up to 1.3 s in Vitest.
describe.each([
  presetOf("lagrange"),
  presetOf("figure-eight"),
])("orbitPath ($slug)", (orbit) => {
  const path = orbitPath(orbit, DETAIL_SIZE_PX);
  const trace = tracePeriod(orbit, orbit.stepsPerPeriod);

  it("starts every body at its initial position", () => {
    path.bodies.forEach((body, i) => {
      const start = orbit.initialState.bodies[i]?.position;
      expect(body[0]?.x).toBeCloseTo(
        start?.x ?? Number.NaN,
        COORDINATE_DECIMALS,
      );
      expect(body[0]?.y).toBeCloseTo(
        start?.y ?? Number.NaN,
        COORDINATE_DECIMALS,
      );
    });
  });

  it("stays within a quarter of a pixel of the traced period at the drawn size", () => {
    const { minX, minY, maxX, maxY } = path.bounds;
    const worldPerPixel = Math.max(maxX - minX, maxY - minY) / DETAIL_SIZE_PX;

    path.bodies.forEach((body, i) => {
      expect(
        largestDistanceToClosedPath(trace[i] ?? [], body),
      ).toBeLessThanOrEqual(PIXEL_TOLERANCE * worldPerPixel + ROUNDING_ERROR);
    });
  });

  it("keeps fewer points for a smaller drawing", () => {
    const thumbnail = orbitPath(orbit, THUMBNAIL_SIZE_PX);

    thumbnail.bodies.forEach((body, i) => {
      expect(body.length).toBeLessThan(path.bodies[i]?.length ?? 0);
      expect(body.length).toBeLessThan(orbit.stepsPerPeriod);
    });
  });

  it("bounds every point of every body", () => {
    const { minX, minY, maxX, maxY } = path.bounds;

    for (const point of trace.flat()) {
      expect(point.x).toBeGreaterThanOrEqual(minX);
      expect(point.x).toBeLessThanOrEqual(maxX);
      expect(point.y).toBeGreaterThanOrEqual(minY);
      expect(point.y).toBeLessThanOrEqual(maxY);
    }
  });
});

describe("orbitPath input", () => {
  it.each([
    0,
    -160,
    Number.NaN,
  ])("rejects a sizePx of %s naming the field", (sizePx) => {
    const call = () => orbitPath(presetOf("lagrange"), sizePx);

    expect(call).toThrow(RangeError);
    expect(call).toThrow(/sizePx/);
  });
});

describe("SVG output", () => {
  it("flips y, so that up in the orbit is up in the picture", () => {
    expect(
      svgPathData([
        { x: 0, y: 1 },
        { x: 1, y: 0 },
        { x: 0, y: -0.5 },
      ]),
    ).toBe("M0 -1L1 0L0 0.5Z");
  });

  it("leaves an open path open", () => {
    expect(
      svgOpenPathData([
        { x: 0, y: 1 },
        { x: 1, y: 0 },
      ]),
    ).toBe("M0 -1L1 0");
  });

  it("converts pixels to view box units for the side that limits the fit", () => {
    const wide = { x: 0, y: 0, width: 4, height: 1 };
    const tall = { x: 0, y: 0, width: 1, height: 3 };

    // A 4:3 picture 400 px wide: the wide frame fills its width, the tall
    // frame its height.
    expect(svgUnitsPerPixel(wide, 400, 300)).toBeCloseTo(0.01);
    expect(svgUnitsPerPixel(tall, 400, 300)).toBeCloseTo(0.01);
  });

  it("frames the bounds with a margin, in the flipped coordinates", () => {
    const frame = svgFrame({ minX: -1, minY: -2, maxX: 1, maxY: 2 });
    // The margin is 5 % of the larger side, 4: 0.2 on every side.
    expect(frame.x).toBeCloseTo(-1.2);
    expect(frame.y).toBeCloseTo(-2.2);
    expect(frame.width).toBeCloseTo(2.4);
    expect(frame.height).toBeCloseTo(4.4);
  });
});
