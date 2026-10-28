import { MAX_TOOL_CALLS } from "./tool-rounds";

export type TurnKind = "new-turn" | "continuation";

export type RateLimitDecision = "allowed" | "rate-limited" | "daily-limit";

export type RateLimiter = {
  check: (clientKey: string, turn: TurnKind) => RateLimitDecision;
};

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;

const REQUESTS_PER_CLIENT_PER_MINUTE = 8;
const REQUESTS_PER_MINUTE = 11;
const REQUESTS_PER_DAY = 400;

const UNKNOWN_CLIENT = "unknown";

/**
 * The route's own limits, kept in memory by this server instance (spec 05,
 * Decision 9). The windows slide: each limit counts the requests it allowed
 * in the last minute or the last day. A refused request is not recorded, so
 * the table holds at most one day of allowed requests.
 */
export function createRateLimiter(now: () => number): RateLimiter {
  let allowed: { time: number; clientKey: string }[] = [];

  return {
    check: (clientKey, turn) => {
      const time = now();
      allowed = allowed.filter((request) => request.time > time - DAY_MS);
      // A turn with tools costs up to four requests, and the route cannot
      // trust the body to say which one this is, so a continuation may go
      // past each limit by the tool calls a turn allows.
      const extra = turn === "continuation" ? MAX_TOOL_CALLS : 0;

      const lastMinute = allowed.filter(
        (request) => request.time > time - MINUTE_MS,
      );

      if (allowed.length >= REQUESTS_PER_DAY + extra) {
        return "daily-limit";
      }

      if (
        lastMinute.length >= REQUESTS_PER_MINUTE + extra ||
        lastMinute.filter((request) => request.clientKey === clientKey)
          .length >=
          REQUESTS_PER_CLIENT_PER_MINUTE + extra
      ) {
        return "rate-limited";
      }

      allowed.push({ time, clientKey });

      return "allowed";
    },
  };
}

export function clientKey(headers: Headers): string {
  const first = headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  return first === undefined || first === "" ? UNKNOWN_CLIENT : first;
}
