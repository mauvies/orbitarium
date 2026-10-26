import type {
  Applied,
  CannonField,
  CannonRequest,
  CannonSettings,
  FieldLimits,
  Rejected,
} from "./types";

// Spec 04, Decision 8: 0.01 km/s is the finest step that separates a crash
// from a circular orbit at 10 km.
export const CANNON_LIMITS: Readonly<Record<CannonField, FieldLimits>> = {
  speedKmPerSecond: { min: 0, max: 15, resolution: 0.01 },
  angleDegrees: { min: 0, max: 90, resolution: 1 },
};

export type ResolvedRequest =
  | ({ readonly status: "applied" } & Applied)
  | Rejected;

type ResolvedField =
  | {
      readonly status: "applied";
      readonly value: number;
      readonly clamped: boolean;
    }
  | Rejected;

/**
 * Applies `request` to the `current` settings (spec 04, Decision 13). Each
 * field present is checked, rounded to its resolution and clamped to its
 * range. The speed is checked first, and a rejected field applies nothing.
 */
export function resolveRequest(
  current: CannonSettings,
  request: CannonRequest,
): ResolvedRequest {
  const speed = resolveField("speedKmPerSecond", current, request);
  if (speed.status === "rejected") {
    return speed;
  }
  const angle = resolveField("angleDegrees", current, request);
  if (angle.status === "rejected") {
    return angle;
  }
  const clamped: CannonField[] = [];
  if (speed.clamped) {
    clamped.push("speedKmPerSecond");
  }
  if (angle.clamped) {
    clamped.push("angleDegrees");
  }
  return {
    status: "applied",
    speedKmPerSecond: speed.value,
    angleDegrees: angle.value,
    clamped,
  };
}

function resolveField(
  field: CannonField,
  current: CannonSettings,
  request: CannonRequest,
): ResolvedField {
  // `hasOwn`, not `=== undefined`: an explicit `undefined` is a bad value,
  // not an absent one.
  if (!Object.hasOwn(request, field)) {
    return { status: "applied", value: current[field], clamped: false };
  }
  const value = request[field];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return { status: "rejected", field, reason: "must be a finite number" };
  }
  const { min, max, resolution } = CANNON_LIMITS[field];
  const rounded = roundToResolution(value, resolution);
  return {
    status: "applied",
    value: Math.min(Math.max(rounded, min), max),
    clamped: rounded < min || rounded > max,
  };
}

/**
 * Rounds to a multiple of `resolution`. Multiplying back by the resolution
 * would leave float noise (0.35 → 0.35000000000000003), so it divides by the
 * whole number of steps per unit instead.
 */
function roundToResolution(value: number, resolution: number): number {
  const stepsPerUnit = Math.round(1 / resolution);
  const rounded = Math.round(value * stepsPerUnit) / stepsPerUnit;
  // Spanish formatting shows -0 as "-0,00".
  return rounded === 0 ? 0 : rounded;
}
