import { describe, expect, it } from "vitest";
import { toolLine } from "./tool-lines";

const REJECTED = {
  status: "rejected",
  field: "speedKmPerSecond",
  reason: "must be a number",
} as const;

// Spec 05, Decision 8 and T6: every action of the tutor shows in the
// conversation, in Spanish, from its result.
describe("toolLine", () => {
  it("says what the cannon was set to", () => {
    expect(
      toolLine({
        tool: "setCannon",
        output: {
          status: "set",
          speedKmPerSecond: 8,
          angleDegrees: 45,
          altitudeKm: 10,
          clamped: [],
        },
      }),
    ).toBe("Ajusto el cañón: 8,00 km/s, 45° y 10 km.");
  });

  it("says when a value was clamped to its maximum", () => {
    expect(
      toolLine({
        tool: "setCannon",
        output: {
          status: "set",
          speedKmPerSecond: 15,
          angleDegrees: 0,
          altitudeKm: 10,
          clamped: ["speedKmPerSecond"],
        },
      }),
    ).toBe(
      "Ajusto el cañón: 15,00 km/s, 0° y 10 km (15,00 km/s es el máximo).",
    );
  });

  it("says when a value was clamped to its minimum", () => {
    expect(
      toolLine({
        tool: "launchCannon",
        output: {
          status: "launched",
          speedKmPerSecond: 8,
          angleDegrees: 0,
          altitudeKm: 10,
          outcome: "ballistic",
          clamped: ["altitudeKm"],
        },
      }),
    ).toBe(
      "Disparo el cañón a 8,00 km/s, 0° y 10 km: cae al suelo (10 km es el mínimo).",
    );
  });

  it("says where a launch went", () => {
    expect(
      toolLine({
        tool: "launchCannon",
        output: {
          status: "launched",
          speedKmPerSecond: 9,
          angleDegrees: 0,
          altitudeKm: 2000,
          outcome: "elliptical-orbit",
          clamped: [],
        },
      }),
    ).toBe("Disparo el cañón a 9,00 km/s, 0° y 2000 km: órbita elíptica.");
  });

  it("names the part it moved to", () => {
    expect(
      toolLine({
        tool: "goToSection",
        output: { status: "moved", section: "cannon" },
      }),
    ).toBe("Voy a “El cañón de Newton”.");
  });

  it("says when an action could not be done", () => {
    expect(toolLine({ tool: "setCannon", output: REJECTED })).toBe(
      "No he podido ajustar el cañón.",
    );
    expect(toolLine({ tool: "launchCannon", output: REJECTED })).toBe(
      "No he podido disparar el cañón.",
    );
    expect(
      toolLine({
        tool: "goToSection",
        output: { status: "rejected", field: "section", reason: "unknown" },
      }),
    ).toBe("No he podido ir a esa parte de la lección.");
  });
});
