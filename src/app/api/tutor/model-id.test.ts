import { describe, expect, it } from "vitest";
import {
  DEFAULT_TUTOR_MODEL,
  isTutorAvailable,
  tutorModelId,
} from "./model-id";

const KEY = { GOOGLE_GENERATIVE_AI_API_KEY: "test-key" };

// Spec 05, Decision 1 and T2: one variable names the model, the key is
// required, and a wrong setting fails loudly, naming the variable.
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

  it("an unset model is the default", () => {
    expect(tutorModelId(KEY)).toBe(DEFAULT_TUTOR_MODEL);
  });

  it("an empty model is the default, as an empty line in .env.local leaves it", () => {
    expect(tutorModelId({ ...KEY, TUTOR_MODEL: " " })).toBe(
      DEFAULT_TUTOR_MODEL,
    );
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

// Spec 05, Decision 12 and T16: the page asks beforehand, with nothing but
// the variables.
describe("isTutorAvailable", () => {
  it("is true with a key", () => {
    expect(isTutorAvailable(KEY)).toBe(true);
  });

  it("is true with a key and a valid model", () => {
    expect(
      isTutorAvailable({ ...KEY, TUTOR_MODEL: "google:gemini-3.5-flash-lite" }),
    ).toBe(true);
  });

  it("is false without a key", () => {
    expect(isTutorAvailable({})).toBe(false);
  });

  it("is false with an empty key", () => {
    expect(isTutorAvailable({ GOOGLE_GENERATIVE_AI_API_KEY: "" })).toBe(false);
  });

  it("is false with a model that does not parse", () => {
    expect(isTutorAvailable({ ...KEY, TUTOR_MODEL: "openai:gpt-5" })).toBe(
      false,
    );
  });
});
