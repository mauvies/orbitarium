import { describe, expect, it } from "vitest";
import {
  CANNON_PRESET_IDS,
  CANNON_PRESETS,
  type CannonSettings,
  launchState,
  traceLaunch,
} from "@/cannon";
import {
  CANNON_STOP_RADIUS,
  CANNON_VIEW_RADIUS,
  viewTrace,
} from "./cannon-view";
import { initialSession, launchCannon } from "./lesson-session";

// The longest trace in the view: 8,435 steps (spec 04, Decision 10).
const SLOWEST: CannonSettings = {
  speedKmPerSecond: 10.05,
  angleDegrees: 0,
  altitudeKm: 10,
};

// Spec 04, L9: the long ellipse stands for a transfer orbit and is seen whole.
describe("the cannon's view", () => {
  it("shows the long ellipse preset whole", () => {
    const { points, end } = traceLaunch(
      launchState(CANNON_PRESETS["long-ellipse"]),
      { stopRadius: CANNON_STOP_RADIUS },
    );
    const outside = points.filter(
      ({ x, y }) =>
        Math.abs(x) > CANNON_VIEW_RADIUS || Math.abs(y) > CANNON_VIEW_RADIUS,
    );

    expect(end).toBe("period");
    expect(outside).toEqual([]);
  });
});

// Spec 04, L24: the predicted path and a launch share one trace.
describe("viewTrace", () => {
  it.each([
    { name: "the circular preset", settings: CANNON_PRESETS["circular-orbit"] },
    { name: "10.05 km/s at 0° from 10 km", settings: SLOWEST },
  ])("is the engine's trace with the view's stop radius: $name", ({
    settings,
  }) => {
    expect(viewTrace(settings)).toEqual(
      traceLaunch(launchState(settings), { stopRadius: CANNON_STOP_RADIUS }),
    );
  });

  it.each([
    ...CANNON_PRESET_IDS.map((id) => ({
      name: id,
      settings: CANNON_PRESETS[id],
    })),
    { name: "10.05 km/s at 0° from 10 km", settings: SLOWEST },
  ])("the predicted path is the trace a launch records: $name", ({
    settings,
  }) => {
    const [launch] = launchCannon(initialSession(), settings).session.launches;

    expect(launch?.trace).toEqual(viewTrace(settings));
  });
});
