/**
 * Spec 02, Decision 3: each orbit takes the smallest value that closes it
 * within 1e-4 (O3), measured with `pnpm measure:orbits` (O4).
 */
export const STEPS_PER_PERIOD_LADDER = [
  1_000, 2_000, 5_000, 10_000, 20_000, 50_000, 100_000, 200_000, 500_000,
  1_000_000,
] as const;
