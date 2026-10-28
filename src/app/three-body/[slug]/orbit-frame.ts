import {
  advancePlayback,
  type OrbitPreset,
  type Playback,
  startPlayback,
} from "@/orbits";
import { PhysicsError } from "@/physics";
import {
  MAX_SUBSTEPS_PER_FRAME,
  type PlaybackSpeed,
  simulationTimeFor,
} from "./speed";
import { extendTrail, type Trail, type TrailSample } from "./trail";

export type AnimationState = {
  readonly playback: Playback;
  readonly trail: Trail;
  /** A period ended without re-anchoring since the bodies were last on their path. */
  readonly drifting: boolean;
  /** Two bodies met while drifting, so the animation stopped (spec 03, Decision 12). */
  readonly collided: boolean;
};

export type FrameControls = {
  readonly speed: PlaybackSpeed;
  readonly correction: boolean;
};

// Spec 03, Decision 6: the trail is sampled from positions the simulation
// passes through, every T/5,000, so it stays within 0.9 px of the path at the
// close encounters; one sample per frame would cut their corners.
export const TRAIL_SAMPLES_PER_PERIOD = 5_000;
export const TRAIL_SPAN_PERIODS = 0.1;

export function startAnimation(orbit: OrbitPreset): AnimationState {
  const playback = startPlayback(orbit);

  return {
    playback,
    trail: [sampleOf(playback)],
    drifting: false,
    collided: false,
  };
}

/**
 * One frame: advances by the screen time that has passed, at the chosen
 * speed, in slices that each add a trail sample, running at most
 * MAX_SUBSTEPS_PER_FRAME substeps and dropping the rest (spec 03,
 * Decision 7).
 */
export function advanceAnimation(
  state: AnimationState,
  elapsedMs: number,
  { speed, correction }: FrameControls,
): AnimationState {
  if (state.collided) {
    return state;
  }

  const { orbit } = state.playback;

  const sliceTime =
    substepsPerSample(orbit) * (orbit.period / orbit.stepsPerPeriod);

  const span = TRAIL_SPAN_PERIODS * orbit.period;
  let { playback, trail, drifting } = state;
  let samples: TrailSample[] = [];
  let remaining = simulationTimeFor(elapsedMs, speed);
  let budget = MAX_SUBSTEPS_PER_FRAME;

  while (remaining > 0 && budget > 0) {
    const time = Math.min(remaining, sliceTime);
    let next: Playback;

    try {
      next = advancePlayback(playback, time, {
        reanchor: correction,
        maxSubsteps: budget,
      });
    } catch (error) {
      if (!(error instanceof PhysicsError)) {
        throw error;
      }

      return {
        playback,
        trail: extendTrail(trail, samples, span),
        drifting,
        collided: true,
      };
    }

    if (next.periodsCompleted > playback.periodsCompleted) {
      if (!correction) {
        drifting = true;
      } else if (drifting) {
        // The bodies snapped back to their path: a trail across the jump
        // would draw a line through the canvas.
        trail = [];
        samples = [];
        drifting = false;
      }
    }

    const ran = substepsRun(next) - substepsRun(playback);

    if (ran > 0) {
      samples.push(sampleOf(next));
    }

    budget -= ran;
    remaining -= time;
    playback = next;
  }

  return {
    playback,
    trail: extendTrail(trail, samples, span),
    drifting,
    collided: false,
  };
}

/** Every substep for orbits of fewer than 5,000 substeps per period. */
function substepsPerSample(orbit: OrbitPreset): number {
  return Math.max(1, orbit.stepsPerPeriod / TRAIL_SAMPLES_PER_PERIOD);
}

function substepsRun(playback: Playback): number {
  return (
    playback.periodsCompleted * playback.orbit.stepsPerPeriod +
    playback.substepInPeriod
  );
}

function sampleOf(playback: Playback): TrailSample {
  return {
    time: playback.state.time,
    positions: playback.state.bodies.map(({ position }) => position),
  };
}
