import { describe, expect, it } from "vitest";
import { answerFlags } from "./answer-flags";

const PLAIN =
  "La Luna cae hacia la Tierra, pero se mueve de lado a más de 7 km/s, tan deprisa que nunca llega. Es como el cañón - pero más grande - de Newton.";

// Spec 05, T13 and Decision 5: the eval's mechanical flags.
describe("answerFlags: Markdown", () => {
  it.each([
    ["bold with asterisks", "Eso es **muy** importante."],
    ["bold with underscores", "Eso es __muy__ importante."],
    ["inline code", "Usa `8 km/s` para orbitar."],
    ["a heading", "# La ley de Newton\nLa fuerza crece con la masa."],
    ["a deeper heading", "Primero.\n## Por qué\nPorque sí."],
  ])("flags %s", (_name, text) => {
    expect(answerFlags(text).markdown).toBe(true);
  });

  it("does not flag plain text with units, a dash and a hyphenated word", () => {
    expect(answerFlags(PLAIN).markdown).toBe(false);
  });

  it("does not flag a number sign in the middle of a sentence", () => {
    expect(answerFlags("Es el caso número # uno.").markdown).toBe(false);
  });
});

describe("answerFlags: lists", () => {
  it.each([
    ["a hyphen", "Mira:\n- la masa\n- la distancia"],
    ["an asterisk", "Mira:\n* la masa"],
    ["a bullet", "Mira:\n• la masa"],
    ["a number", "Mira:\n1. la masa\n2. la distancia"],
    ["an indented hyphen", "Mira:\n  - la masa"],
  ])("flags %s at the start of a line", (_name, text) => {
    expect(answerFlags(text).list).toBe(true);
  });

  it("does not flag a dash in the middle of a sentence", () => {
    expect(answerFlags(PLAIN).list).toBe(false);
  });

  it("does not flag bold as a bullet", () => {
    expect(answerFlags("**Ojo**: la fuerza es igual.").list).toBe(false);
  });

  it("does not flag a decimal number at the start of a line", () => {
    expect(answerFlags("7.9 km/s es la velocidad circular.").list).toBe(false);
  });
});

// Decision 5's rule is about distances fallen, which are «en un segundo»,
// and not about speeds, which are «por segundo» after a unit.
describe("answerFlags: «por segundo»", () => {
  it.each([
    ["a distance", "La manzana cae una distancia por segundo."],
    ["metres fallen", "Los metros caídos por segundo crecen."],
    ["capitals", "Cae mucho POR SEGUNDO."],
  ])("flags it said of %s", (_name, text) => {
    expect(answerFlags(text).perSecond).toBe(true);
  });

  it.each([
    ["km por segundo is not flagged", "Va a 8 km por segundo."],
    ["kilómetros por segundo is not flagged", "Va a 8 kilómetros por segundo."],
    ["metros por segundo is not flagged", "Va a 8000 metros por segundo."],
    ["m por segundo is not flagged", "Va a 8000 m por segundo."],
    ["«en un segundo» is not flagged", "Cae unos 5 metros en un segundo."],
  ])("%s", (_name, text) => {
    expect(answerFlags(text).perSecond).toBe(false);
  });

  it("flags a distance even when a speed in km por segundo is in the same answer", () => {
    expect(
      answerFlags("Va a 8 km por segundo y cae una distancia por segundo.")
        .perSecond,
    ).toBe(true);
  });
});
