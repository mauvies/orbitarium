import { describe, expect, it } from "vitest";
import { advance } from "@/physics";
import { deepFreeze } from "@/physics/testing/assertions";
import { getOrbit } from "./catalog";
import { advancePlayback, startPlayback } from "./playback";
import type { OrbitPreset, OrbitSlug, PlaybackOptions } from "./types";

// Spec 02, O7.
const CARRY_TOLERANCE = 1e-12;

// Spec 02, O5.
const BOUNDARIES = 10;

function presetOf(slug: OrbitSlug): OrbitPreset {
  const preset = getOrbit(slug);
  if (preset === undefined) {
    throw new RangeError(`no orbit with slug "${slug}"`);
  }
  return preset;
}

function substepOf({ period, stepsPerPeriod }: OrbitPreset): number {
  return period / stepsPerPeriod;
}

/** Enough substeps for any call in these tests to run uncapped. */
function uncapped(orbit: OrbitPreset, reanchor: boolean): PlaybackOptions {
  return { reanchor, maxSubsteps: 10 * orbit.stepsPerPeriod };
}

const lagrange = presetOf("lagrange");

// Spec 02, O5.
describe.each([
  presetOf("lagrange"),
  presetOf("figure-eight"),
])("re-anchors at every period ($slug)", (orbit) => {
  const options = uncapped(orbit, true);
  const dt = substepOf(orbit);

  it("returns exactly to the initial bodies at every boundary", () => {
    let playback = startPlayback(orbit);
    for (let boundary = 1; boundary <= BOUNDARIES; boundary++) {
      playback = advancePlayback(playback, orbit.period, options);

      expect(playback.state.bodies).toStrictEqual(orbit.initialState.bodies);
      expect(playback.substepInPeriod).toBe(0);
      expect(playback.periodsCompleted).toBe(boundary);
    }
  });

  it("keeps state.time increasing, at a multiple of the period on every boundary", () => {
    const callsPerPeriod = 4;
    let playback = startPlayback(orbit);
    for (let call = 1; call <= BOUNDARIES * callsPerPeriod; call++) {
      const previousTime = playback.state.time;
      playback = advancePlayback(
        playback,
        orbit.period / callsPerPeriod,
        options,
      );

      expect(playback.state.time).toBeGreaterThan(previousTime);
      if (playback.substepInPeriod === 0) {
        expect(playback.state.time).toBe(
          orbit.initialState.time + playback.periodsCompleted * orbit.period,
        );
      }
    }
  });

  it("restarts from the initial bodies when a call crosses a boundary", () => {
    const beforeBoundary = advancePlayback(
      startPlayback(orbit),
      (orbit.stepsPerPeriod - 3) * dt,
      options,
    );
    const crossed = advancePlayback(beforeBoundary, 5 * dt, options);
    const twoSubstepsIn = advancePlayback(
      startPlayback(orbit),
      2 * dt,
      options,
    );

    expect(crossed.periodsCompleted).toBe(1);
    expect(crossed.substepInPeriod).toBe(2);
    expect(crossed.state.bodies).toStrictEqual(twoSubstepsIn.state.bodies);
  });

  it("counts every boundary crossed in one call", () => {
    const playback = advancePlayback(
      startPlayback(orbit),
      3.5 * orbit.period,
      options,
    );

    expect(playback.periodsCompleted).toBe(3);
    expect(playback.substepInPeriod).toBe(orbit.stepsPerPeriod / 2);
  });
});

// Spec 02, Decision 5.
describe("applies a change of re-anchoring at the next boundary", () => {
  const drifted = advancePlayback(
    startPlayback(lagrange),
    lagrange.period,
    uncapped(lagrange, false),
  );

  it("keeps the drifted bodies at a boundary without re-anchoring", () => {
    expect(drifted.periodsCompleted).toBe(1);
    expect(drifted.state.bodies).not.toStrictEqual(
      lagrange.initialState.bodies,
    );
  });

  it("snaps back to the initial bodies at the next boundary once re-anchoring is on", () => {
    const halfway = advancePlayback(
      drifted,
      lagrange.period / 2,
      uncapped(lagrange, true),
    );
    const snapped = advancePlayback(
      halfway,
      lagrange.period / 2,
      uncapped(lagrange, true),
    );

    const stillDrifting = advancePlayback(
      drifted,
      lagrange.period / 2,
      uncapped(lagrange, false),
    );

    expect(halfway.state.bodies).toStrictEqual(stillDrifting.state.bodies);
    expect(snapped.periodsCompleted).toBe(2);
    expect(snapped.state.bodies).toStrictEqual(lagrange.initialState.bodies);
  });
});

// Spec 02, O7.
describe("accumulates frame time into whole substeps", () => {
  const dt = substepOf(lagrange);
  const options = uncapped(lagrange, true);

  it("gives the same playback for 150 frames as for one call with their total", () => {
    // 60 frames per period: one period per second at 60 Hz, 2.5 periods in all.
    const frames = Array.from({ length: 150 }, () => lagrange.period / 60);
    const total = frames.reduce((sum, frame) => sum + frame, 0);

    const frameByFrame = frames.reduce(
      (playback, frame) => advancePlayback(playback, frame, options),
      startPlayback(lagrange),
    );
    const inOneCall = advancePlayback(startPlayback(lagrange), total, options);

    expect(frameByFrame.periodsCompleted).toBe(inOneCall.periodsCompleted);
    expect(frameByFrame.substepInPeriod).toBe(inOneCall.substepInPeriod);
    expect(frameByFrame.state.bodies).toStrictEqual(inOneCall.state.bodies);
    expect(Math.abs(frameByFrame.carry - inOneCall.carry)).toBeLessThanOrEqual(
      CARRY_TOLERANCE,
    );
  });

  it("runs substeps of exactly dt", () => {
    // For Lagrange's dt, (5 · dt) / 5 is not dt: a single advance over 5 · dt
    // would take substeps one ulp off.
    const callsOfFiveSubsteps = Array.from(
      { length: lagrange.stepsPerPeriod / 5 },
      () => 5 * dt,
    );
    const playback = callsOfFiveSubsteps.reduce(
      (current, duration) =>
        advancePlayback(current, duration, uncapped(lagrange, false)),
      startPlayback(lagrange),
    );
    // One call for the whole period: each of its substeps is period / stepsPerPeriod.
    const oneAdvance = advance(lagrange.initialState, lagrange.period, { dt });

    expect(playback.state.bodies).toStrictEqual(oneAdvance.bodies);
  });

  it("carries the remainder to the next call", () => {
    const first = advancePlayback(startPlayback(lagrange), 2.5 * dt, options);
    const second = advancePlayback(first, 0.5 * dt, options);

    expect(first.substepInPeriod).toBe(2);
    expect(Math.abs(first.carry - 0.5 * dt)).toBeLessThanOrEqual(
      CARRY_TOLERANCE,
    );
    expect(second.substepInPeriod).toBe(3);
    expect(second.carry).toBeLessThanOrEqual(CARRY_TOLERANCE);
  });

  it("runs k substeps when advanced by k · dt", () => {
    // (5 · dt) / dt is 4.999999999999999 for Lagrange's dt.
    const k = 5;

    expect(
      advancePlayback(startPlayback(lagrange), k * dt, options).substepInPeriod,
    ).toBe(k);
  });

  it("runs at most maxSubsteps and drops the excess", () => {
    const maxSubsteps = 1500;
    const capped = advancePlayback(
      startPlayback(lagrange),
      10 * lagrange.period,
      {
        reanchor: true,
        maxSubsteps,
      },
    );
    const atSubstep500 = advancePlayback(
      startPlayback(lagrange),
      500 * dt,
      options,
    );

    expect(capped.periodsCompleted).toBe(1);
    expect(capped.substepInPeriod).toBe(500);
    expect(capped.carry).toBe(0);
    expect(capped.state.bodies).toStrictEqual(atSubstep500.state.bodies);
  });

  it("completes a boundary reached exactly at the cap", () => {
    const capped = advancePlayback(
      startPlayback(lagrange),
      5 * lagrange.period,
      {
        reanchor: true,
        maxSubsteps: lagrange.stepsPerPeriod,
      },
    );

    expect(capped.periodsCompleted).toBe(1);
    expect(capped.substepInPeriod).toBe(0);
    expect(capped.carry).toBe(0);
    expect(capped.state.bodies).toStrictEqual(lagrange.initialState.bodies);
  });
});

// Spec 02, O9.
describe("does not mutate its input", () => {
  const orbit = deepFreeze(structuredClone(lagrange));
  const playback = deepFreeze(startPlayback(orbit));

  it.each([
    true,
    false,
  ])("leaves the playback and options unchanged (reanchor: %s)", (reanchor) => {
    const options = deepFreeze({ reanchor, maxSubsteps: 2000 });
    const snapshot = structuredClone({ playback, options });

    advancePlayback(playback, 1.5 * orbit.period, options);

    expect({ playback, options }).toStrictEqual(snapshot);
  });

  it("gives the same output for the same input", () => {
    const options = { reanchor: true, maxSubsteps: 2000 };

    expect(
      advancePlayback(playback, 1.5 * orbit.period, options),
    ).toStrictEqual(advancePlayback(playback, 1.5 * orbit.period, options));
  });
});

// Spec 02, O10.
describe("rejects invalid input naming the field", () => {
  const playback = startPlayback(lagrange);

  it.each([
    -1,
    Number.NaN,
    Number.POSITIVE_INFINITY,
  ])("rejects a simulationTime of %s", (simulationTime) => {
    const call = () =>
      advancePlayback(playback, simulationTime, uncapped(lagrange, true));

    expect(call).toThrow(RangeError);
    expect(call).toThrow(/simulationTime/);
  });

  it.each([
    0,
    1.5,
    Number.NaN,
  ])("rejects a maxSubsteps of %s", (maxSubsteps) => {
    const call = () =>
      advancePlayback(playback, 1, { reanchor: true, maxSubsteps });

    expect(call).toThrow(RangeError);
    expect(call).toThrow(/maxSubsteps/);
  });
});
