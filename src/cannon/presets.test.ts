import { describe, expect, it } from "vitest";
import { resolveRequest } from "./controls";
import { launchOutcome } from "./outcome";
import { CANNON_PRESETS, REFERENCE_SPEEDS } from "./presets";
import type { CannonOutcome } from "./types";
import { kmPerSecondToKmPerHour } from "./units";

// Spec 04, L7: what the design note shows next to the speed control.
const SHOWN_CIRCULAR_KM_PER_SECOND = 7.9;
const SHOWN_CIRCULAR_KM_PER_HOUR = 28_000;
const SHOWN_ESCAPE_KM_PER_SECOND = 11.2;
// The plan review's values at 10 km.
const CIRCULAR_KM_PER_SECOND = 7.90359;
const ESCAPE_KM_PER_SECOND = 11.17736;

const OUTCOMES: readonly CannonOutcome[] = [
  "ballistic",
  "circular-orbit",
  "elliptical-orbit",
  "escape",
];

describe("presets", () => {
  it.each(OUTCOMES)("the %s preset gives its outcome", (outcome) => {
    expect(launchOutcome(CANNON_PRESETS[outcome])).toBe(outcome);
  });

  it.each(
    OUTCOMES,
  )("the %s preset is a setting the controls can show", (outcome) => {
    const settings = CANNON_PRESETS[outcome];

    expect(resolveRequest(settings, settings)).toEqual({
      status: "applied",
      ...settings,
      clamped: [],
    });
  });
});

describe("reference speeds", () => {
  it("come from the model at the launch point", () => {
    expect(REFERENCE_SPEEDS.circularKmPerSecond).toBeCloseTo(
      CIRCULAR_KM_PER_SECOND,
      5,
    );
    expect(REFERENCE_SPEEDS.escapeKmPerSecond).toBeCloseTo(
      ESCAPE_KM_PER_SECOND,
      5,
    );
  });

  it("round to the values shown: 7.9 km/s, 28,000 km/h and 11.2 km/s", () => {
    const { circularKmPerSecond, escapeKmPerSecond } = REFERENCE_SPEEDS;

    expect(Math.round(circularKmPerSecond * 10) / 10).toBe(
      SHOWN_CIRCULAR_KM_PER_SECOND,
    );
    expect(
      Math.round(kmPerSecondToKmPerHour(circularKmPerSecond) / 1_000) * 1_000,
    ).toBe(SHOWN_CIRCULAR_KM_PER_HOUR);
    expect(Math.round(escapeKmPerSecond * 10) / 10).toBe(
      SHOWN_ESCAPE_KM_PER_SECOND,
    );
  });
});
