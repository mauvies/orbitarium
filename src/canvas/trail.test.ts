import { describe, expect, it } from "vitest";
import { extendTrail, type TrailSample } from "./trail";

const sampleAt = (time: number): TrailSample => ({
  time,
  positions: [{ x: time, y: 0 }],
});
const SPAN = 1;

describe("extendTrail", () => {
  it("adds the new samples after the old ones", () => {
    const trail = extendTrail(
      [sampleAt(0)],
      [sampleAt(0.2), sampleAt(0.4)],
      SPAN,
    );

    expect(trail.map(({ time }) => time)).toEqual([0, 0.2, 0.4]);
  });

  it("drops the samples older than the span before the newest", () => {
    const trail = extendTrail(
      [sampleAt(0), sampleAt(0.5), sampleAt(1)],
      [sampleAt(1.6)],
      SPAN,
    );

    expect(trail.map(({ time }) => time)).toEqual([1, 1.6]);
  });

  it("keeps the trail as it is when there is nothing new", () => {
    const trail = [sampleAt(0), sampleAt(0.5)];

    expect(extendTrail(trail, [], SPAN)).toBe(trail);
  });

  it.each([
    0,
    -1,
    Number.NaN,
  ])("rejects a span of %s naming the field", (span) => {
    const call = () => extendTrail([], [sampleAt(0)], span);

    expect(call).toThrow(RangeError);
    expect(call).toThrow(/span/);
  });
});
