// Bundles TypeScript entry points with Vite and loads them in plain Node, as
// the app runs them: under Vitest's module runner every import becomes a
// getter, which slows the engine's hot loop (spec 01, "Benchmark").
import { fileURLToPath } from "node:url";
import { build } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));

/**
 * Bundles `entries` ({ name: source path }) into `.bench/<directory>/` and
 * returns the loaded module of each entry, by name.
 */
export async function bundleForNode(directory, entries) {
  const outDir = new URL(`../.bench/${directory}/`, import.meta.url);
  await build({
    root,
    configFile: false,
    publicDir: false,
    logLevel: "warn",
    resolve: { tsconfigPaths: true },
    build: {
      ssr: true,
      outDir: fileURLToPath(outDir),
      emptyOutDir: true,
      rolldownOptions: {
        input: entries,
        output: { entryFileNames: "[name].mjs" },
      },
    },
  });
  const modules = await Promise.all(
    Object.keys(entries).map(async (name) => [
      name,
      await import(new URL(`${name}.mjs`, outDir).href),
    ]),
  );
  return Object.fromEntries(modules);
}
