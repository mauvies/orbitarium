import { describe, expect, it } from "vitest";

// Spec 01, E14. Imports through "@/physics" on purpose: it is the only test of the Vitest alias.
describe("environment", () => {
  it("loads the public entry point without DOM globals", async () => {
    expect("window" in globalThis).toBe(false);
    expect("document" in globalThis).toBe(false);

    await expect(import("@/physics")).resolves.toBeDefined();
  });
});
