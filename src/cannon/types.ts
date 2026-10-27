import type { Vec2 } from "@/physics";

/** What the cannon is set to, in the UI's units. */
export type CannonSettings = {
  readonly speedKmPerSecond: number;
  /** Above the local horizontal: 0° fires along the ground, 90° straight up. */
  readonly angleDegrees: number;
  /** The launch point's height above the ground. */
  readonly altitudeKm: number;
};

export type CannonOutcome =
  | "ballistic"
  | "circular-orbit"
  | "elliptical-orbit"
  | "escape";

/** The shot as it leaves the cannon, in engine units, relative to the Earth's centre. */
export type LaunchState = {
  readonly position: Vec2;
  readonly velocity: Vec2;
};

export type CannonField = keyof CannonSettings;

/**
 * What a caller asks the cannon for. A field left out keeps its current value.
 * The values are `unknown` because the tutor's tool input is untyped at
 * runtime: they are checked, not trusted (spec 04, Decision 13).
 */
export type CannonRequest = {
  readonly [Field in CannonField]?: unknown;
};

export type FieldLimits = {
  readonly min: number;
  readonly max: number;
  readonly resolution: number;
};

/** The settings actually applied: rounded, then clamped. */
export type Applied = CannonSettings & {
  /** The fields whose rounded value was outside its range. */
  readonly clamped: readonly CannonField[];
};

export type Rejected = {
  readonly status: "rejected";
  readonly field: CannonField;
  /** For developers and the tutor's model, not for the learner. */
  readonly reason: string;
};
