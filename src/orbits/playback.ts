import { runSubsteps } from "./stepping";
import type { OrbitPreset, Playback, PlaybackOptions } from "./types";
import { validateMaxSubsteps, validateSimulationTime } from "./validate";

// Spec 01, Decision 2: absorbs round-off, so advancing by k · dt runs k
// substeps, not k − 1.
const ROUND_OFF_MARGIN = 1e-9;

export function startPlayback(orbit: OrbitPreset): Playback {
  return {
    orbit,
    state: orbit.initialState,
    substepInPeriod: 0,
    periodsCompleted: 0,
    carry: 0,
  };
}

/**
 * Advances by `simulationTime` in whole substeps of the orbit's dt, carrying
 * the remainder to the next call (spec 02, Decision 6).
 */
export function advancePlayback(
  playback: Playback,
  simulationTime: number,
  { reanchor, maxSubsteps }: PlaybackOptions,
): Playback {
  validateSimulationTime(simulationTime);
  validateMaxSubsteps(maxSubsteps);
  const dt = substepOf(playback.orbit);
  const available = playback.carry + simulationTime;
  const due = Math.floor(available / dt + ROUND_OFF_MARGIN);
  if (due > maxSubsteps) {
    // A long pause slows the playback down instead of freezing the page.
    return { ...runAcrossPeriods(playback, maxSubsteps, reanchor), carry: 0 };
  }
  return {
    ...runAcrossPeriods(playback, due, reanchor),
    carry: Math.max(0, available - due * dt),
  };
}

function runAcrossPeriods(
  playback: Playback,
  substeps: number,
  reanchor: boolean,
): Playback {
  const { orbit } = playback;
  let current = playback;
  let remaining = substeps;
  while (remaining > 0) {
    const chunk = Math.min(
      remaining,
      orbit.stepsPerPeriod - current.substepInPeriod,
    );
    current = {
      ...current,
      state: runSubsteps(current.state, chunk, substepOf(orbit)),
      substepInPeriod: current.substepInPeriod + chunk,
    };
    if (current.substepInPeriod === orbit.stepsPerPeriod) {
      current = completePeriod(current, reanchor);
    }
    remaining -= chunk;
  }
  return current;
}

/** The boundary belongs to the last substep of the period (spec 02, Decision 4). */
function completePeriod(playback: Playback, reanchor: boolean): Playback {
  const { initialState, period } = playback.orbit;
  const periodsCompleted = playback.periodsCompleted + 1;
  const state = reanchor
    ? {
        bodies: initialState.bodies,
        time: initialState.time + periodsCompleted * period,
      }
    : playback.state;
  return { ...playback, state, substepInPeriod: 0, periodsCompleted };
}

function substepOf({ period, stepsPerPeriod }: OrbitPreset): number {
  return period / stepsPerPeriod;
}
