export type PhysicsErrorCode = "coincident-bodies" | "non-finite";

// Spec 01, Decision 8: a physically singular situation, as opposed to invalid
// input (RangeError), so callers can tell the two apart.
export class PhysicsError extends Error {
  readonly code: PhysicsErrorCode;
  readonly bodies: readonly number[];

  constructor(
    code: PhysicsErrorCode,
    bodies: readonly number[],
    message: string,
  ) {
    super(message);
    this.name = "PhysicsError";
    this.code = code;
    this.bodies = bodies;
  }
}
