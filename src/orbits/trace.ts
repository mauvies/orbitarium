import type { SystemState, Vec2 } from "@/physics";
import { runSubsteps } from "./stepping";
import type { OrbitPreset } from "./types";
import { validatePoints } from "./validate";

/**
 * The position of each body at `points` times evenly spaced over one period,
 * starting at the initial positions: [body][sample]. The samples are the
 * playback's own positions, so the bodies ride exactly on the trace
 * (spec 02, Decision 7).
 */
export function tracePeriod(
  orbit: OrbitPreset,
  points: number,
): readonly (readonly Vec2[])[] {
  validatePoints(points, orbit.stepsPerPeriod);
  const substepsPerSample = orbit.stepsPerPeriod / points;
  const dt = orbit.period / orbit.stepsPerPeriod;
  let state = orbit.initialState;
  const samples = [state];
  while (samples.length < points) {
    state = runSubsteps(state, substepsPerSample, dt);
    samples.push(state);
  }
  return orbit.initialState.bodies.map((_, body) =>
    samples.map((sample) => positionOf(sample, body)),
  );
}

function positionOf(state: SystemState, body: number): Vec2 {
  const position = state.bodies[body]?.position;
  if (position === undefined) {
    throw new RangeError(`state.bodies[${body}] is missing`);
  }
  return position;
}
