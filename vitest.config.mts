// .mts: package.json has no "type": "module", so Vite would load a .ts config as CommonJS.
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    // The Playwright specs in e2e/ match Vitest's default pattern too.
    include: ["src/**/*.test.ts"],
    environment: "node",
    globals: false,
  },
});
