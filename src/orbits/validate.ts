// Spec 02, O10.

export function validateSimulationTime(simulationTime: number): void {
  if (!(Number.isFinite(simulationTime) && simulationTime >= 0)) {
    throw new RangeError(
      `simulationTime must be a finite number greater than or equal to 0, got ${simulationTime}`,
    );
  }
}

export function validateMaxSubsteps(maxSubsteps: number): void {
  if (!(Number.isInteger(maxSubsteps) && maxSubsteps > 0)) {
    throw new RangeError(
      `options.maxSubsteps must be a positive integer, got ${maxSubsteps}`,
    );
  }
}
