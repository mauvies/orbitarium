import { describe, expect, it } from "vitest";
import { resolveRequest } from "./controls";
import { launchOutcome } from "./outcome";
import {
  CANNON_PRESET_IDS,
  CANNON_PRESETS,
  type CannonPresetId,
  referenceSpeeds,
} from "./presets";
import type { CannonOutcome } from "./types";

// Spec 04, L7: what the design note shows next to the speed control.
const SHOWN_CIRCULAR_KM_PER_SECOND = 7.9;
const SHOWN_ESCAPE_KM_PER_SECOND = 11.2;
// The plan review's values at 10 km.
const MOUNTAIN_KM = 10;
const CIRCULAR_KM_PER_SECOND = 7.90359;
const ESCAPE_KM_PER_SECOND = 11.17736;
// Spec 04, L7: at the top of the height's range.
const HIGHEST_KM = 2_000;
const SHOWN_CIRCULAR_AT_HIGHEST_KM_PER_SECOND = 6.9;
const SHOWN_ESCAPE_AT_HIGHEST_KM_PER_SECOND = 9.8;

// Spec 04, Decision 11: the long ellipse stands for a transfer orbit.
const EXPECTED_OUTCOMES: Readonly<Record<CannonPresetId, CannonOutcome>> = {
  ballistic: "ballistic",
  "circular-orbit": "circular-orbit",
  "elliptical-orbit": "elliptical-orbit",
  "long-ellipse": "elliptical-orbit",
  escape: "escape",
};

const roundedToTenth = (speed: number) => Math.round(speed * 10) / 10;

describe("presets", () => {
  it("are five, in the panel's order", () => {
    expect(CANNON_PRESET_IDS).toEqual([
      "ballistic",
      "circular-orbit",
      "elliptical-orbit",
      "long-ellipse",
      "escape",
    ]);
  });

  it.each(CANNON_PRESET_IDS)("the %s preset gives its outcome", (id) => {
    expect(launchOutcome(CANNON_PRESETS[id])).toBe(EXPECTED_OUTCOMES[id]);
  });

  it.each(CANNON_PRESET_IDS)("the %s preset fires from 10 km", (id) => {
    expect(CANNON_PRESETS[id].altitudeKm).toBe(MOUNTAIN_KM);
  });

  it.each(
    CANNON_PRESET_IDS,
  )("the %s preset is a setting the controls can show", (id) => {
    const settings = CANNON_PRESETS[id];

    expect(resolveRequest(settings, settings)).toEqual({
      status: "applied",
      ...settings,
      clamped: [],
    });
  });
});

describe("reference speeds", () => {
  it("come from the model at the launch point", () => {
    const atMountain = referenceSpeeds(MOUNTAIN_KM);

    expect(atMountain.circularKmPerSecond).toBeCloseTo(
      CIRCULAR_KM_PER_SECOND,
      5,
    );
    expect(atMountain.escapeKmPerSecond).toBeCloseTo(ESCAPE_KM_PER_SECOND, 5);
  });

  it("round to the values shown: 7.9 and 11.2 km/s", () => {
    const { circularKmPerSecond, escapeKmPerSecond } =
      referenceSpeeds(MOUNTAIN_KM);

    expect(roundedToTenth(circularKmPerSecond)).toBe(
      SHOWN_CIRCULAR_KM_PER_SECOND,
    );
    expect(roundedToTenth(escapeKmPerSecond)).toBe(SHOWN_ESCAPE_KM_PER_SECOND);
  });

  it("follow the height: 6.9 and 9.8 km/s at 2,000 km", () => {
    const { circularKmPerSecond, escapeKmPerSecond } =
      referenceSpeeds(HIGHEST_KM);

    expect(roundedToTenth(circularKmPerSecond)).toBe(
      SHOWN_CIRCULAR_AT_HIGHEST_KM_PER_SECOND,
    );
    expect(roundedToTenth(escapeKmPerSecond)).toBe(
      SHOWN_ESCAPE_AT_HIGHEST_KM_PER_SECOND,
    );
  });
});
