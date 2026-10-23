import type { SystemState } from "@/physics";
import type { STEPS_PER_PERIOD_LADDER } from "./ladder";

export type OrbitSlug =
  | "lagrange"
  | "figure-eight"
  | "butterfly-i"
  | "goggles"
  | "moth-i"
  | "yin-yang-i";

/** One of the ladder values (spec 02, Decision 3). */
export type StepsPerPeriod = (typeof STEPS_PER_PERIOD_LADDER)[number];

export type OrbitPreset = {
  /** Stable identifier, used in the orbit's URL. */
  readonly slug: OrbitSlug;
  readonly name: string;
  readonly initialState: SystemState;
  readonly period: number;
  /** Substeps per period: dt = period / stepsPerPeriod. */
  readonly stepsPerPeriod: StepsPerPeriod;
  /** Where the values start from (spec 02, Decision 1). */
  readonly source: string;
};

export type Playback = {
  readonly orbit: OrbitPreset;
  readonly state: SystemState;
  /** Substeps run in the current period: 0 … stepsPerPeriod − 1. */
  readonly substepInPeriod: number;
  readonly periodsCompleted: number;
  /** Simulation time not yet run: less than one substep. */
  readonly carry: number;
};

export type PlaybackOptions = {
  /** Replace the bodies by the initial bodies at every period boundary (spec 02, Decision 4). */
  readonly reanchor: boolean;
  /** The most substeps one call runs; any excess time is dropped (spec 02, Decision 6). */
  readonly maxSubsteps: number;
};
