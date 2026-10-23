// Spec 01, E15. Times the engine bundled, as the app runs it: under Vitest's
// module runner every import becomes a getter, which dominates the hot loop.
import { cpus } from "node:os";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import { build } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const outDir = new URL("../.bench/physics/", import.meta.url);

const WARM_UP_CALLS = 300;
const TIMED_CALLS = 1000;
// 1 / 0.001 is exactly 1000, so each call runs 1,000 substeps.
const DURATION = 1;
const DT = 0.001;

await build({
  root,
  configFile: false,
  publicDir: false,
  logLevel: "warn",
  build: {
    ssr: true,
    outDir: fileURLToPath(outDir),
    emptyOutDir: true,
    rolldownOptions: {
      input: {
        engine: "src/physics/index.ts",
        fixtures: "src/physics/testing/fixtures.ts",
      },
      output: { entryFileNames: "[name].mjs" },
    },
  },
});

const { advance } = await import(new URL("engine.mjs", outDir).href);
const { lagrangeTriangle } = await import(new URL("fixtures.mjs", outDir).href);

function timeAdvance(integrator) {
  const options = { dt: DT, integrator };
  for (let call = 0; call < WARM_UP_CALLS; call++) {
    advance(lagrangeTriangle, DURATION, options);
  }
  const milliseconds = [];
  for (let call = 0; call < TIMED_CALLS; call++) {
    const start = performance.now();
    advance(lagrangeTriangle, DURATION, options);
    milliseconds.push(performance.now() - start);
  }
  milliseconds.sort((a, b) => a - b);
  const mean = milliseconds.reduce((sum, ms) => sum + ms, 0) / TIMED_CALLS;
  const p99 = milliseconds[Math.floor(TIMED_CALLS * 0.99)];
  return { mean, p99 };
}

console.log(`${cpus()[0]?.model}, Node ${process.version}`);
for (const integrator of ["yoshida4", "verlet"]) {
  const { mean, p99 } = timeAdvance(integrator);
  console.log(
    `${integrator.padEnd(8)} mean ${mean.toFixed(3)} ms   p99 ${p99.toFixed(3)} ms`,
  );
}
