// Spec 02, Risks. Times the bundled playback, as the app runs it: one 60 Hz
// frame per orbit at one period every 5 seconds, against a single `advance`
// call for the same substeps (the cost of Decision 6), and one tracePeriod.
import { cpus } from "node:os";
import { performance } from "node:perf_hooks";
import { bundleForNode } from "./bundle.mjs";

const WARM_UP_CALLS = 300;
const TIMED_CALLS = 1000;
// 60 Hz with one period every 5 s, the reference of spec 02's Risks.
const FRAMES_PER_PERIOD = 60 * 5;
// Divides every ladder value, so it is valid for every orbit.
const TRACE_POINTS = 100;
const TRACE_CALLS = 3;

const { engine, catalog } = await bundleForNode("playback", {
  engine: "src/physics/index.ts",
  catalog: "src/orbits/index.ts",
});
const { advance } = engine;
const { orbits, startPlayback, advancePlayback, tracePeriod } = catalog;

function summarize(milliseconds) {
  const sorted = [...milliseconds].sort((a, b) => a - b);
  const mean = sorted.reduce((sum, ms) => sum + ms, 0) / sorted.length;
  return { mean, p99: sorted[Math.floor(sorted.length * 0.99)] };
}

/** Times `call` after warming it up; `call` returns the input of its next run. */
function timeCalls(call, input) {
  let next = input;
  for (let i = 0; i < WARM_UP_CALLS; i++) {
    next = call(next);
  }
  const milliseconds = [];
  for (let i = 0; i < TIMED_CALLS; i++) {
    const start = performance.now();
    next = call(next);
    milliseconds.push(performance.now() - start);
  }
  return summarize(milliseconds);
}

function timeFrames(orbit) {
  const frame = orbit.period / FRAMES_PER_PERIOD;
  const options = { reanchor: true, maxSubsteps: orbit.stepsPerPeriod };
  return timeCalls(
    (playback) => advancePlayback(playback, frame, options),
    startPlayback(orbit),
  );
}

function timeOneAdvance(orbit, substeps) {
  const dt = orbit.period / orbit.stepsPerPeriod;
  return timeCalls(() => {
    advance(orbit.initialState, substeps * dt, { dt });
  });
}

function timeTrace(orbit) {
  const milliseconds = Array.from({ length: TRACE_CALLS }, () => {
    const start = performance.now();
    tracePeriod(orbit, TRACE_POINTS);
    return performance.now() - start;
  });
  return summarize(milliseconds).mean;
}

const microseconds = (ms, substeps) => ((ms * 1000) / substeps).toFixed(2);

console.log(`${cpus()[0]?.model}, Node ${process.version}\n`);
console.log(
  "| Orbit | Substeps per frame | Frame mean | Frame p99 | Per substep | One advance call, per substep | Trace of one period |",
);
console.log("|---|---|---|---|---|---|---|");
for (const orbit of orbits) {
  // A frame runs this many substeps on average: the carry makes some longer.
  const substeps = orbit.stepsPerPeriod / FRAMES_PER_PERIOD;
  const frames = timeFrames(orbit);
  const oneAdvance = timeOneAdvance(orbit, Math.round(substeps));
  console.log(
    `| ${orbit.name} | ${substeps.toLocaleString("en-US", { maximumFractionDigits: 1 })} | ${frames.mean.toFixed(3)} ms | ${frames.p99.toFixed(3)} ms | ${microseconds(frames.mean, substeps)} µs | ${microseconds(oneAdvance.mean, Math.round(substeps))} µs | ${timeTrace(orbit).toFixed(0)} ms |`,
  );
}
