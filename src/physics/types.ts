// Units are dimensionless and G is a parameter (spec 01, Decision 3).

export type Vec2 = { readonly x: number; readonly y: number };

export type Body = {
  readonly mass: number;
  readonly position: Vec2;
  readonly velocity: Vec2;
};

export type SystemState = {
  readonly bodies: readonly Body[];
  readonly time: number;
};

export type IntegratorName = "yoshida4" | "verlet";

export type ForceOptions = {
  /** Gravitational constant. Default 1. */
  readonly G?: number;
  /** Plummer softening length ε. Default 0 (exact gravity). */
  readonly softening?: number;
};

export type SimulationOptions = ForceOptions & {
  /** Maximum substep. */
  readonly dt: number;
  /** Default "yoshida4". */
  readonly integrator?: IntegratorName;
};
