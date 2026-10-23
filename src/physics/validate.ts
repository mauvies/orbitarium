import type {
  ForceOptions,
  IntegratorName,
  SimulationOptions,
  SystemState,
  Vec2,
} from "./types";

// Spec 01, E12.

export type ResolvedForceOptions = {
  readonly G: number;
  readonly softening: number;
};

export type ResolvedSimulationOptions = ResolvedForceOptions & {
  readonly dt: number;
  readonly integrator: IntegratorName;
};

const INTEGRATOR_NAMES: readonly IntegratorName[] = ["yoshida4", "verlet"];

function requireFinite(value: number, name: string): number {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} must be a finite number, got ${value}`);
  }
  return value;
}

function requirePositive(value: number, name: string): number {
  if (!(Number.isFinite(value) && value > 0)) {
    throw new RangeError(
      `${name} must be a finite number greater than 0, got ${value}`,
    );
  }
  return value;
}

function requireNonNegative(value: number, name: string): number {
  if (!(Number.isFinite(value) && value >= 0)) {
    throw new RangeError(
      `${name} must be a finite number greater than or equal to 0, got ${value}`,
    );
  }
  return value;
}

function requireFiniteVec(vector: Vec2, name: string): void {
  requireFinite(vector.x, `${name}.x`);
  requireFinite(vector.y, `${name}.y`);
}

export function validateState(state: SystemState): void {
  if (state.bodies.length === 0) {
    throw new RangeError("state.bodies must contain at least one body");
  }
  requireFinite(state.time, "state.time");
  for (const [i, body] of state.bodies.entries()) {
    const name = `state.bodies[${i}]`;
    requirePositive(body.mass, `${name}.mass`);
    requireFiniteVec(body.position, `${name}.position`);
    requireFiniteVec(body.velocity, `${name}.velocity`);
  }
}

export function validateDuration(duration: number): void {
  requireNonNegative(duration, "duration");
}

export function resolveForceOptions(
  options: ForceOptions = {},
): ResolvedForceOptions {
  return {
    G: requireNonNegative(options.G ?? 1, "options.G"),
    softening: requireNonNegative(options.softening ?? 0, "options.softening"),
  };
}

export function parseIntegratorName(value: string): IntegratorName {
  const integrator = INTEGRATOR_NAMES.find((name) => name === value);
  if (integrator === undefined) {
    const names = INTEGRATOR_NAMES.map((name) => `"${name}"`).join(", ");
    throw new RangeError(
      `options.integrator must be one of ${names}, got "${value}"`,
    );
  }
  return integrator;
}

export function resolveSimulationOptions(
  options: SimulationOptions,
): ResolvedSimulationOptions {
  return {
    ...resolveForceOptions(options),
    dt: requirePositive(options.dt, "options.dt"),
    integrator: parseIntegratorName(options.integrator ?? "yoshida4"),
  };
}
