import type { SystemState } from "@/physics";

export type OrbitSlug =
  | "lagrange"
  | "figure-eight"
  | "butterfly-i"
  | "goggles"
  | "moth-i"
  | "yin-yang-i";

export type OrbitPreset = {
  /** Stable identifier, used in the orbit's URL. */
  readonly slug: OrbitSlug;
  readonly name: string;
  readonly initialState: SystemState;
  readonly period: number;
  /** Where the values start from (spec 02, Decision 1). */
  readonly source: string;
};
