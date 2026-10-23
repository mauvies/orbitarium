// Spec 02, O4. For each orbit, measures the closure after one period at every
// ladder value up to its stepsPerPeriod (or up to the first one that closes),
// and at twice its stepsPerPeriod. Prints a Markdown table for the spec, and
// fails if stepsPerPeriod is not the smallest ladder value that meets O3 or if
// the closure there is not truncation error.
import { bundleForNode } from "./bundle.mjs";

// Spec 02, O3.
const CLOSURE_TOLERANCE = 1e-4;
// Fourth order: doubling the steps divides the error by 2⁴. Same band as spec 01, E9.
const TRUNCATION_RATIO = { min: 12, max: 20 };

const { engine, catalog } = await bundleForNode("orbits", {
  engine: "src/physics/index.ts",
  catalog: "src/orbits/index.ts",
});
const { advance, PhysicsError } = engine;
const { orbits, STEPS_PER_PERIOD_LADDER } = catalog;

function largestDistance(first, second, field) {
  return Math.max(
    ...first.bodies.map((body, i) => {
      const other = second.bodies[i][field];
      return Math.hypot(body[field].x - other.x, body[field].y - other.y);
    }),
  );
}

/** How far every position and velocity ends from its start after one period. */
function closure({ initialState, period }, stepsPerPeriod) {
  try {
    const end = advance(initialState, period, { dt: period / stepsPerPeriod });
    return {
      stepsPerPeriod,
      position: largestDistance(initialState, end, "position"),
      velocity: largestDistance(initialState, end, "velocity"),
    };
  } catch (error) {
    if (error instanceof PhysicsError) {
      return { stepsPerPeriod, position: Infinity, velocity: Infinity };
    }
    throw error;
  }
}

const worst = ({ position, velocity }) => Math.max(position, velocity);
const closes = (result) => worst(result) <= CLOSURE_TOLERANCE;

function ladderClosures(orbit) {
  const results = [];
  for (const steps of STEPS_PER_PERIOD_LADDER) {
    results.push(closure(orbit, steps));
    if (steps >= orbit.stepsPerPeriod && results.some(closes)) {
      return results;
    }
  }
  return results;
}

const format = (value) =>
  Number.isFinite(value) ? value.toExponential(1) : "PhysicsError";
const formatClosure = (result) =>
  `${format(result.position)} / ${format(result.velocity)}`;
const formatSteps = (steps) => steps.toLocaleString("en-US");
const formatMargin = (margin) =>
  `${margin.toLocaleString("en-US", { maximumFractionDigits: margin < 10 ? 1 : 0 })}×`;

const failures = [];
const rows = orbits.map((orbit) => {
  const results = ladderClosures(orbit);
  const smallest = results.find(closes)?.stepsPerPeriod;
  if (smallest !== orbit.stepsPerPeriod) {
    failures.push(
      `${orbit.slug}: stepsPerPeriod is ${orbit.stepsPerPeriod}, but the smallest ladder value that meets O3 is ${smallest ?? "none"}`,
    );
  }
  const index = results.findIndex(
    (result) => result.stepsPerPeriod === orbit.stepsPerPeriod,
  );
  const chosen = results[index];
  const lower = results[index - 1];
  const doubled = closure(orbit, 2 * orbit.stepsPerPeriod);
  const ratio = worst(chosen) / worst(doubled);
  if (ratio < TRUNCATION_RATIO.min || ratio > TRUNCATION_RATIO.max) {
    failures.push(
      `${orbit.slug}: doubling the steps divides the closure by ${ratio.toFixed(1)}, outside ${TRUNCATION_RATIO.min}–${TRUNCATION_RATIO.max}`,
    );
  }
  return [
    orbit.name,
    orbit.period.toFixed(4),
    formatSteps(orbit.stepsPerPeriod),
    formatClosure(chosen),
    formatMargin(CLOSURE_TOLERANCE / worst(chosen)),
    lower === undefined
      ? "none (bottom of the ladder)"
      : `${formatSteps(lower.stepsPerPeriod)}: ${formatClosure(lower)}`,
    `${formatClosure(doubled)} (÷${ratio.toFixed(1)})`,
    Math.round(orbit.stepsPerPeriod / orbit.period).toLocaleString("en-US"),
  ];
});

console.log(`Node ${process.version}, ${process.arch}\n`);
console.log(
  "| Orbit | T | Steps per period | Closure (position / velocity) | Margin to 1e-4 | Next lower value | At twice the steps (ratio) | Substeps per unit of time |",
);
console.log("|---|---|---|---|---|---|---|---|");
for (const row of rows) {
  console.log(`| ${row.join(" | ")} |`);
}
if (failures.length > 0) {
  console.error(`\n${failures.join("\n")}`);
  process.exit(1);
}
