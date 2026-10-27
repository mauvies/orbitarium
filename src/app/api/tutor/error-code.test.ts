import { APICallError, RetryError } from "ai";
import { describe, expect, it } from "vitest";
import { toErrorCode } from "./error-code";

function quotaExceeded(quotaId: string): APICallError {
  return googleError(429, {
    error: {
      code: 429,
      status: "RESOURCE_EXHAUSTED",
      message: "You exceeded your current quota",
      details: [
        {
          "@type": "type.googleapis.com/google.rpc.QuotaFailure",
          violations: [{ quotaId, quotaValue: "15" }],
        },
        {
          "@type": "type.googleapis.com/google.rpc.RetryInfo",
          retryDelay: "5s",
        },
      ],
    },
  });
}

function googleError(statusCode: number, data: unknown): APICallError {
  return new APICallError({
    message: "provider error",
    url: "https://generativelanguage.googleapis.com",
    requestBodyValues: {},
    statusCode,
    data,
    isRetryable: statusCode === 429 || statusCode >= 500,
  });
}

const PER_MINUTE = "GenerateRequestsPerMinutePerProjectPerModel-FreeTier";
const PER_DAY = "GenerateRequestsPerDayPerProjectPerModel-FreeTier";

describe("toErrorCode", () => {
  it("a 429 over the per-minute quota is rate-limited", () => {
    expect(toErrorCode(quotaExceeded(PER_MINUTE))).toBe("rate-limited");
  });

  it("a 429 over the per-day quota is daily-limit", () => {
    expect(toErrorCode(quotaExceeded(PER_DAY))).toBe("daily-limit");
  });

  it("a 429 that names no quota is rate-limited", () => {
    expect(toErrorCode(googleError(429, undefined))).toBe("rate-limited");
  });

  it("a 429 whose details are not the expected shape is rate-limited", () => {
    expect(toErrorCode(googleError(429, { error: { details: "?" } }))).toBe(
      "rate-limited",
    );
  });

  it("a per-day 429 inside a RetryError is daily-limit", () => {
    const error = new RetryError({
      message: "Failed after 3 attempts",
      reason: "maxRetriesExceeded",
      errors: [quotaExceeded(PER_MINUTE), quotaExceeded(PER_DAY)],
    });

    expect(toErrorCode(error)).toBe("daily-limit");
  });

  it("a per-minute 429 inside a RetryError is rate-limited", () => {
    const error = new RetryError({
      message: "Failed after 3 attempts",
      reason: "maxRetriesExceeded",
      errors: [quotaExceeded(PER_MINUTE)],
    });

    expect(toErrorCode(error)).toBe("rate-limited");
  });

  it("an overloaded model is unavailable", () => {
    expect(toErrorCode(googleError(503, undefined))).toBe("unavailable");
  });

  it("a plain error is unavailable", () => {
    expect(toErrorCode(new Error("socket hang up"))).toBe("unavailable");
  });

  it("a value that is not an error is unavailable", () => {
    expect(toErrorCode("boom")).toBe("unavailable");
  });
});
