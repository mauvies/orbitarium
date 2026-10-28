import { APICallError, RetryError } from "ai";
import { z } from "zod";
import type { TutorErrorCode } from "@/lib/tutor/error-codes";

const TOO_MANY_REQUESTS = 429;
const FIRST_SERVER_ERROR = 500;

// Google names the quota that was exceeded in a `QuotaFailure` detail
// (spec 05, Decision 10); only the ids are read.
const quotaFailure = z.object({
  error: z.object({
    details: z.array(
      z.looseObject({
        violations: z.array(z.looseObject({ quotaId: z.string() })).optional(),
      }),
    ),
  }),
});

export function toErrorCode(error: unknown): TutorErrorCode {
  const failure = RetryError.isInstance(error) ? error.lastError : error;

  if (!APICallError.isInstance(failure)) {
    return "unavailable";
  }

  if (isServerError(failure)) {
    return "busy";
  }

  if (failure.statusCode !== TOO_MANY_REQUESTS) {
    return "unavailable";
  }

  return quotaIds(failure.data).some((id) => id.includes("PerDay"))
    ? "daily-limit"
    : "rate-limited";
}

/** Google's «high demand» is a 503 (spec 05, Decision 10). */
export function isServerError({ statusCode }: APICallError): boolean {
  return statusCode !== undefined && statusCode >= FIRST_SERVER_ERROR;
}

function quotaIds(data: unknown): string[] {
  const parsed = quotaFailure.safeParse(data);

  if (!parsed.success) {
    return [];
  }

  return parsed.data.error.details
    .flatMap(({ violations = [] }) => violations)
    .map(({ quotaId }) => quotaId);
}
