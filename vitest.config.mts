// .mts: package.json has no "type": "module", so Vite would load a .ts config as CommonJS.
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    globals: false,
  },
});
