import { describe, expect, it } from "vitest";
import { tutorModelId } from "./model-id";

const KEY = { GOOGLE_GENERATIVE_AI_API_KEY: "test-key" };

// Spec 05, Decision 1 and T2: one variable names the model, and a missing
// or wrong setting fails loudly, naming the variable.
describe("tutorModelId", () => {
  it("is the model TUTOR_MODEL names", () => {
    expect(
      tutorModelId({ ...KEY, TUTOR_MODEL: "google:gemini-3.5-flash-lite" }),
    ).toBe("google:gemini-3.5-flash-lite");
  });

  it("a missing key names the variable", () => {
    expect(() =>
      tutorModelId({ TUTOR_MODEL: "google:gemini-3.5-flash-lite" }),
    ).toThrow("GOOGLE_GENERATIVE_AI_API_KEY");
  });

  it("an empty key counts as missing", () => {
    expect(() =>
      tutorModelId({
        GOOGLE_GENERATIVE_AI_API_KEY: "",
        TUTOR_MODEL: "google:gemini-3.5-flash-lite",
      }),
    ).toThrow("GOOGLE_GENERATIVE_AI_API_KEY");
  });

  it("a missing model names TUTOR_MODEL", () => {
    expect(() => tutorModelId(KEY)).toThrow("TUTOR_MODEL");
  });

  it("an unknown provider names TUTOR_MODEL", () => {
    expect(() => tutorModelId({ ...KEY, TUTOR_MODEL: "openai:gpt-5" })).toThrow(
      "TUTOR_MODEL",
    );
  });

  it("a provider without a model names TUTOR_MODEL", () => {
    expect(() => tutorModelId({ ...KEY, TUTOR_MODEL: "google:" })).toThrow(
      "TUTOR_MODEL",
    );
  });
});
