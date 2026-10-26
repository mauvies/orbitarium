import type { Vec2 } from "@/physics";

/** What the cannon is set to, in the UI's units. */
export type CannonSettings = {
  readonly speedKmPerSecond: number;
  /** Above the local horizontal: 0° fires along the ground, 90° straight up. */
  readonly angleDegrees: number;
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
