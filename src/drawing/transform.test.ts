import { describe, expect, it } from "vitest";
import { fitTransform, toCanvas } from "./transform";

// An orbit twice as wide as it is tall, centred on (1, 0).
const WIDE_BOUNDS = { minX: -1, minY: -1, maxX: 3, maxY: 1 };
const SQUARE_CANVAS_PX = 400;
const PADDING_PX = 20;

describe("fitTransform", () => {
  const transform = fitTransform(
    WIDE_BOUNDS,
    SQUARE_CANVAS_PX,
    SQUARE_CANVAS_PX,
    PADDING_PX,
  );

  it("fits the larger side of the bounds inside the padding", () => {
    const left = toCanvas({ x: WIDE_BOUNDS.minX, y: 0 }, transform);
    const right = toCanvas({ x: WIDE_BOUNDS.maxX, y: 0 }, transform);

    expect(left.x).toBeCloseTo(PADDING_PX);
    expect(right.x).toBeCloseTo(SQUARE_CANVAS_PX - PADDING_PX);
  });

  it("keeps the aspect ratio: a unit is as tall as it is wide", () => {
    const origin = toCanvas({ x: 0, y: 0 }, transform);
    const unitRight = toCanvas({ x: 1, y: 0 }, transform);
    const unitUp = toCanvas({ x: 0, y: 1 }, transform);

    expect(unitRight.x - origin.x).toBeCloseTo(origin.y - unitUp.y);
  });

  it("centres the bounds", () => {
    const centre = toCanvas({ x: 1, y: 0 }, transform);

    expect(centre.x).toBeCloseTo(SQUARE_CANVAS_PX / 2);
    expect(centre.y).toBeCloseTo(SQUARE_CANVAS_PX / 2);
  });

  it("points y up, as in the simulation", () => {
    const lower = toCanvas({ x: 0, y: -1 }, transform);
    const higher = toCanvas({ x: 0, y: 1 }, transform);

    expect(higher.y).toBeLessThan(lower.y);
  });

  it.each([
    ["width", () => fitTransform(WIDE_BOUNDS, 0, 400, 0)],
    ["height", () => fitTransform(WIDE_BOUNDS, 400, Number.NaN, 0)],
    ["padding", () => fitTransform(WIDE_BOUNDS, 400, 400, 200)],
    [
      "bounds",
      () => fitTransform({ minX: 1, minY: 1, maxX: 1, maxY: 1 }, 400, 400, 0),
    ],
  ])("rejects an invalid %s naming the field", (field, call) => {
    expect(call).toThrow(RangeError);
    expect(call).toThrow(new RegExp(field));
  });
});
