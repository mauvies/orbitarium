import { describe, expect, it } from "vitest";
import type { Vec2 } from "@/physics";
import { maxDistance } from "@/physics/testing/assertions";
import { advancePlayback, startPlayback } from "./playback";
import { HEAVY_TEST_TIMEOUT_MS, positions, presetOf } from "./testing/support";
import type { OrbitPreset } from "./types";

// Spec 03, Decision 9.
const PATH_TOLERANCE = 0.1;
const PERIODS = 30;
const SAMPLES_PER_PERIOD = 1_000;

/**
 * The first period in which a body is more than PATH_TOLERANCE from where it
 * was at the same phase of the first period, without re-anchoring; undefined
 * if none is within PERIODS.
 */
function firstPeriodOffPath(orbit: OrbitPreset): number | undefined {
  const substepsPerSample = orbit.stepsPerPeriod / SAMPLES_PER_PERIOD;
  const sampleTime = substepsPerSample * (orbit.period / orbit.stepsPerPeriod);
  const options = { reanchor: false, maxSubsteps: substepsPerSample };
  const firstPeriod = [positions(orbit.initialState)];
  let playback = startPlayback(orbit);

  for (let sample = 1; sample <= PERIODS * SAMPLES_PER_PERIOD; sample++) {
    playback = advancePlayback(playback, sampleTime, options);
    const phase = sample % SAMPLES_PER_PERIOD;

    if (playback.substepInPeriod !== phase * substepsPerSample) {
      throw new Error(`sample ${sample} is out of phase`);
    }

    if (sample < SAMPLES_PER_PERIOD) {
      firstPeriod.push(positions(playback.state));
    } else if (
      maxDistance(positions(playback.state), samePhase(firstPeriod, phase)) >
      PATH_TOLERANCE
    ) {
      return Math.ceil(sample / SAMPLES_PER_PERIOD);
    }
  }

  return undefined;
}

function samePhase(
  firstPeriod: readonly (readonly Vec2[])[],
  phase: number,
): readonly Vec2[] {
  const reference = firstPeriod[phase];

  if (reference === undefined) {
    throw new RangeError(`no sample at phase ${phase}`);
  }

  return reference;
}

// Butterfly I and yin-yang I leave their path at periods 11 and 15: about 3 s
// and 20 s in Vitest. `pnpm measure:stability` checks all six (spec 03, G7).
describe.each([
  presetOf("figure-eight"),
  presetOf("moth-i"),
  presetOf("lagrange"),
  presetOf("goggles"),
])("records whether $slug holds its path for 30 periods without correction", (orbit) => {
  it(
    "matches the simulation",
    () => {
      const isNeverOffPath = firstPeriodOffPath(orbit) === undefined;

      expect(orbit.holdsWithoutCorrection).toBe(isNeverOffPath);
    },
    HEAVY_TEST_TIMEOUT_MS,
  );
});
