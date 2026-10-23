// Spec 03, Decision 9 and G7. For each orbit, plays 30 periods without
// re-anchoring and measures how far the bodies get from where they were at
// the same phase of the first period, 1,000 times per period. Prints a
// Markdown table for the spec, and fails if a preset's holdsWithoutCorrection
// disagrees with the measurement.
import { bundleForNode } from "./bundle.mjs";

const PATH_TOLERANCE = 0.1;
const PERIODS = 30;
const SAMPLES_PER_PERIOD = 1000;

const { engine, catalog } = await bundleForNode("stability", {
  engine: "src/physics/index.ts",
  catalog: "src/orbits/index.ts",
});
const { PhysicsError } = engine;
const { orbits, startPlayback, advancePlayback } = catalog;

const positions = (state) => state.bodies.map((body) => body.position);

function largestDistance(first, second) {
  return Math.max(
    ...first.map((a, i) => Math.hypot(a.x - second[i].x, a.y - second[i].y)),
  );
}

/**
 * The first period over the tolerance, sampled densely and at period
 * boundaries only, and the largest distance measured. Stops once both are
 * known, or when the bodies collide.
 */
function measureDrift(orbit) {
  const substepsPerSample = orbit.stepsPerPeriod / SAMPLES_PER_PERIOD;
  const sampleTime = substepsPerSample * (orbit.period / orbit.stepsPerPeriod);
  const options = { reanchor: false, maxSubsteps: substepsPerSample };
  const firstPeriod = [positions(orbit.initialState)];
  const result = { dense: undefined, boundary: undefined, largest: 0 };
  let playback = startPlayback(orbit);
  for (let sample = 1; sample <= PERIODS * SAMPLES_PER_PERIOD; sample++) {
    const period = Math.ceil(sample / SAMPLES_PER_PERIOD);
    try {
      playback = advancePlayback(playback, sampleTime, options);
    } catch (error) {
      if (!(error instanceof PhysicsError)) throw error;
      result.dense ??= period;
      result.boundary ??= period;
      result.largest = Number.POSITIVE_INFINITY;
      return result;
    }
    const phase = sample % SAMPLES_PER_PERIOD;
    if (playback.substepInPeriod !== phase * substepsPerSample) {
      throw new Error(`${orbit.slug}: sample ${sample} is out of phase`);
    }
    if (sample < SAMPLES_PER_PERIOD) {
      firstPeriod.push(positions(playback.state));
      continue;
    }
    const distance = largestDistance(
      positions(playback.state),
      firstPeriod[phase],
    );
    result.largest = Math.max(result.largest, distance);
    if (distance > PATH_TOLERANCE) {
      result.dense ??= period;
      if (phase === 0) result.boundary ??= period;
    }
    if (result.dense !== undefined && result.boundary !== undefined) {
      return result;
    }
  }
  return result;
}

const format = (value) =>
  Number.isFinite(value) ? value.toExponential(1) : "collision";
const label = (holds) =>
  holds ? "Se mantiene sola" : "Se deshace sin corrección";

const failures = [];
const rows = orbits.map((orbit) => {
  const drift = measureDrift(orbit);
  const holds = drift.dense === undefined;
  if (holds !== orbit.holdsWithoutCorrection) {
    failures.push(
      `${orbit.slug}: holdsWithoutCorrection is ${orbit.holdsWithoutCorrection}, but the measurement says ${holds}`,
    );
  }
  return [
    orbit.name,
    drift.dense ?? "none",
    drift.boundary ?? "none",
    holds ? format(drift.largest) : "—",
    label(holds),
  ];
});

console.log(`Node ${process.version}, ${process.arch}\n`);
console.log(
  `| Orbit | First period over ${PATH_TOLERANCE} | At period boundaries only | Largest over ${PERIODS} periods | Label |`,
);
console.log("|---|---|---|---|---|");
for (const row of rows) {
  console.log(`| ${row.join(" | ")} |`);
}
if (failures.length > 0) {
  console.error(`\n${failures.join("\n")}`);
  process.exit(1);
}
