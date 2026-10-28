import { describe, expect, it } from "vitest";

// Spec 02, O9. Imports through "@/orbits", as spec 01's environment test does for "@/physics".
describe("environment", () => {
  it("loads the public entry point without DOM globals", async () => {
    expect("window" in globalThis).toBe(false);
    expect("document" in globalThis).toBe(false);
    await expect(import("@/orbits")).resolves.toBeDefined();
  });
});
