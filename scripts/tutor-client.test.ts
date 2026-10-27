import { describe, expect, it } from "vitest";
import { CONTEXT, runTool } from "./tutor-client.mjs";

// Spec 05, Decision 4: after a tool's result the page sends the context it
// left, and the eval's stand-in for the controls must do the same.
describe("runTool: setCannon", () => {
  it("sets the fields it is given and keeps the others", () => {
    const { output, context } = runTool(CONTEXT, "setCannon", {
      speedKmPerSecond: 9,
    });

    expect(output).toEqual({
      status: "set",
      speedKmPerSecond: 9,
      angleDegrees: 0,
      altitudeKm: 10,
      clamped: [],
    });
    expect(context.cannon.settings.speedKmPerSecond).toBe(9);
  });

  it("does not record a launch", () => {
    const { context } = runTool(CONTEXT, "setCannon", { speedKmPerSecond: 9 });

    expect(context.cannon.lastLaunch).toBeNull();
  });

  it("clamps a speed over the limit and says which field", () => {
    const { output } = runTool(CONTEXT, "setCannon", { speedKmPerSecond: 50 });

    expect(output).toMatchObject({
      speedKmPerSecond: 15,
      clamped: ["speedKmPerSecond"],
    });
  });

  it("rounds to the field's resolution without calling it clamped", () => {
    const { output } = runTool(CONTEXT, "setCannon", { altitudeKm: 123 });

    expect(output).toMatchObject({ altitudeKm: 120, clamped: [] });
  });

  it("rejects a speed that is not a number, naming the field", () => {
    const { output, context } = runTool(CONTEXT, "setCannon", {
      speedKmPerSecond: "rápido",
    });

    expect(output).toMatchObject({
      status: "rejected",
      field: "speedKmPerSecond",
    });
    expect(context).toBe(CONTEXT);
  });
});

describe("runTool: launchCannon", () => {
  it("launches with the current settings plus the input, and records the launch", () => {
    const { output, context } = runTool(CONTEXT, "launchCannon", {
      speedKmPerSecond: 8,
    });

    expect(output).toMatchObject({
      status: "launched",
      outcome: "elliptical-orbit",
      speedKmPerSecond: 8,
    });
    expect(context.cannon.lastLaunch).toEqual({
      speedKmPerSecond: 8,
      angleDegrees: 0,
      altitudeKm: 10,
      outcome: "elliptical-orbit",
    });
  });

  it.each([
    [5, "ballistic"],
    [7.9, "circular-orbit"],
    [9, "elliptical-orbit"],
    [12, "escape"],
  ])("a speed of %s km/s is %s", (speedKmPerSecond, outcome) => {
    const { output } = runTool(CONTEXT, "launchCannon", { speedKmPerSecond });

    expect(output).toMatchObject({ outcome });
  });

  it("launches a speed over the limit clamped", () => {
    const { output, context } = runTool(CONTEXT, "launchCannon", {
      speedKmPerSecond: 50,
    });

    expect(output).toMatchObject({
      speedKmPerSecond: 15,
      clamped: ["speedKmPerSecond"],
      outcome: "escape",
    });
    expect(context.cannon.lastLaunch?.speedKmPerSecond).toBe(15);
  });
});

describe("runTool: goToSection", () => {
  it("moves to a part and the context says so", () => {
    const { output, context } = runTool(CONTEXT, "goToSection", {
      section: "moon",
    });

    expect(output).toEqual({ status: "moved", section: "moon" });
    expect(context.section).toBe("moon");
  });

  it("rejects a part that does not exist, naming the field", () => {
    const { output, context } = runTool(CONTEXT, "goToSection", {
      section: "mars",
    });

    expect(output).toMatchObject({ status: "rejected", field: "section" });
    expect(context).toBe(CONTEXT);
  });
});

it("a tool it has no stand-in for throws, naming it", () => {
  expect(() => runTool(CONTEXT, "makeCoffee", {})).toThrow("makeCoffee");
});
