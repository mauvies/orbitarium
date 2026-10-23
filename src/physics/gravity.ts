import { PhysicsError } from "./errors";
import type { Body, ForceOptions, SystemState, Vec2 } from "./types";
import { resolveForceOptions, validateState } from "./validate";
import { add, isFiniteVec, lengthSquared, scale, sub, ZERO } from "./vec2";

type ForceParameters = {
  readonly G: number;
  readonly softeningSquared: number;
};

/** Plummer-softened Newtonian gravity on each body (spec 01, Decision 4). */
export function accelerations(
  state: SystemState,
  options?: ForceOptions,
): readonly Vec2[] {
  validateState(state);
  const { G, softening } = resolveForceOptions(options);
  const parameters = { G, softeningSquared: softening * softening };
  return state.bodies.map((body, index) =>
    accelerationOf(index, body, state.bodies, parameters),
  );
}

function accelerationOf(
  index: number,
  body: Body,
  bodies: readonly Body[],
  parameters: ForceParameters,
): Vec2 {
  let total = ZERO;
  for (const [sourceIndex, source] of bodies.entries()) {
    if (sourceIndex !== index) {
      total = add(
        total,
        pullFrom(source, sourceIndex, body, index, parameters),
      );
    }
  }
  if (!isFiniteVec(total)) {
    throw new PhysicsError(
      "non-finite",
      [index],
      `the acceleration of body ${index} overflows; masses or G are too large`,
    );
  }
  return total;
}

function pullFrom(
  source: Body,
  sourceIndex: number,
  target: Body,
  targetIndex: number,
  { G, softeningSquared }: ForceParameters,
): Vec2 {
  const offset = sub(source.position, target.position);
  // Spec 01, E13: distanceSquared is zero for coincident bodies without
  // softening, and also for distinct bodies closer than ~1e-154, where r²
  // underflows.
  const distanceSquared = lengthSquared(offset) + softeningSquared;
  if (distanceSquared === 0) {
    throw new PhysicsError(
      "coincident-bodies",
      [targetIndex, sourceIndex],
      `bodies ${targetIndex} and ${sourceIndex} are at the same position; gravity between them is undefined without softening`,
    );
  }
  const distance = Math.sqrt(distanceSquared);
  return scale(offset, (G * source.mass) / (distanceSquared * distance));
}
