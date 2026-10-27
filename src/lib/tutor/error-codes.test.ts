import { describe, expect, it } from "vitest";
import { parseErrorCode, TUTOR_ERROR_CODES } from "./error-codes";

describe("parseErrorCode", () => {
  it.each(TUTOR_ERROR_CODES)("reads %s back from its own text", (code) => {
    expect(parseErrorCode(code)).toBe(code);
  });

  it("takes the reason of a refused request, which is not a code, as unavailable", () => {
    expect(parseErrorCode("context.section: not a part of the lesson")).toBe(
      "unavailable",
    );
  });

  it("takes the SDK's own message for a failed fetch as unavailable", () => {
    expect(parseErrorCode("Failed to fetch the chat response.")).toBe(
      "unavailable",
    );
  });

  it("takes an empty message as unavailable", () => {
    expect(parseErrorCode("")).toBe("unavailable");
  });
});
