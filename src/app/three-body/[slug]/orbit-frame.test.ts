import { describe, expect, it } from "vitest";
import { advancePlayback, type Playback, startPlayback } from "@/orbits";
import { positions, presetOf } from "@/orbits/testing/support";
import { coincidentTriple } from "@/physics/testing/fixtures";
import {
  advanceAnimation,
  type FrameControls,
  startAnimation,
  TRAIL_SAMPLES_PER_PERIOD,
  TRAIL_SPAN_PERIODS,
} from "./orbit-frame";
import { MAX_SUBSTEPS_PER_FRAME } from "./speed";

const lagrange = presetOf("lagrange");
const mothI = presetOf("moth-i");

const corrected: FrameControls = { speed: 1, correction: true };
const uncorrected: FrameControls = { speed: 1, correction: false };

/** Milliseconds of screen time for `periods` of the orbit at 1×. */
const msFor = (periods: number, period = lagrange.period) =>
  periods * period * 1_000;

const substepsRun = (playback: Playback) =>
  playback.periodsCompleted * playback.orbit.stepsPerPeriod +
  playback.substepInPeriod;

const timesOf = (state: ReturnType<typeof startAnimation>) =>
  state.trail.map(({ time }) => time);

describe("advanceAnimation", () => {
  it("starts at the initial bodies, with them as the first trail sample", () => {
    const state = startAnimation(lagrange);

    expect(state.playback).toEqual(startPlayback(lagrange));
    expect(state.trail).toEqual([
      {
        time: lagrange.initialState.time,
        positions: positions(lagrange.initialState),
      },
    ]);
  });

  it("gives exactly the bodies of one playback call: slicing changes nothing", () => {
    const simulationTime = 0.6;

    const state = advanceAnimation(startAnimation(lagrange), 300, {
      ...corrected,
      speed: 2,
    });

    const oneCall = advancePlayback(startPlayback(lagrange), simulationTime, {
      reanchor: true,
      maxSubsteps: lagrange.stepsPerPeriod,
    });

    expect(state.playback.substepInPeriod).toBe(oneCall.substepInPeriod);
    expect(state.playback.state.bodies).toStrictEqual(oneCall.state.bodies);
  });

  it("records a trail sample every T/5,000 of simulation time", () => {
    // Moth I runs 20,000 substeps per period: a sample every 4 substeps.
    const sampleTime =
      (mothI.stepsPerPeriod / TRAIL_SAMPLES_PER_PERIOD) *
      (mothI.period / mothI.stepsPerPeriod);

    const state = advanceAnimation(startAnimation(mothI), 100, corrected);
    const times = timesOf(state);
    // The last sample ends the frame, after whatever is left of a slice.
    const gaps = times.slice(1, -1).map((time, i) => time - (times[i] ?? 0));

    expect(gaps.length).toBeGreaterThan(30);

    for (const gap of gaps) {
      expect(gap).toBeCloseTo(sampleTime, 12);
    }
  });

  it("runs at most MAX_SUBSTEPS_PER_FRAME substeps in a frame and drops the rest", () => {
    const state = advanceAnimation(startAnimation(lagrange), msFor(10), {
      ...corrected,
      speed: 4,
    });

    expect(substepsRun(state.playback)).toBe(MAX_SUBSTEPS_PER_FRAME);
    expect(state.playback.carry).toBe(0);
  });

  it("keeps only the last tenth of a period in the trail", () => {
    const state = advanceAnimation(
      startAnimation(lagrange),
      msFor(0.5),
      corrected,
    );

    const times = timesOf(state);
    const newest = times.at(-1) ?? Number.NaN;

    expect(times[0]).toBeGreaterThanOrEqual(
      newest - TRAIL_SPAN_PERIODS * lagrange.period,
    );
    expect(times.length).toBeGreaterThan(1);
  });

  it("keeps the trail through a period boundary with correction on", () => {
    let state = startAnimation(lagrange);

    for (let frame = 0; frame < 3; frame++) {
      state = advanceAnimation(state, msFor(0.3), corrected);
    }

    // Just past the boundary, so the trail must reach back across it.
    state = advanceAnimation(state, msFor(0.12), corrected);

    const times = timesOf(state);
    const span = (times.at(-1) ?? 0) - (times[0] ?? 0);

    expect(state.playback.periodsCompleted).toBe(1);
    expect(state.drifting).toBe(false);
    expect(span).toBeCloseTo(TRAIL_SPAN_PERIODS * lagrange.period, 2);
  });

  it("clears the trail when correction snaps drifted bodies back", () => {
    let state = startAnimation(lagrange);
    state = advanceAnimation(state, msFor(0.6), uncorrected);
    state = advanceAnimation(state, msFor(0.6), uncorrected);

    expect(state.drifting).toBe(true);

    state = advanceAnimation(state, msFor(0.6), corrected);
    // Just past the boundary: without the snap clearing it, the trail would
    // still reach back before it.
    state = advanceAnimation(state, msFor(0.22), corrected);

    expect(state.playback.periodsCompleted).toBe(2);
    expect(state.drifting).toBe(false);
    // Nothing from before the snap at the end of the second period.
    expect(timesOf(state)[0]).toBeGreaterThanOrEqual(2 * lagrange.period);
  });

  it("stops with a collision instead of throwing, and stays stopped", () => {
    const colliding = { ...lagrange, initialState: coincidentTriple };
    const start = startAnimation(colliding);

    const collided = advanceAnimation(start, msFor(0.1), uncorrected);

    expect(collided.collided).toBe(true);
    expect(collided.playback).toEqual(start.playback);
    expect(advanceAnimation(collided, msFor(0.1), uncorrected)).toBe(collided);
  });
});
