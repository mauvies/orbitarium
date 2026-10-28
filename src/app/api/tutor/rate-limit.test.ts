import { beforeEach, describe, expect, it } from "vitest";
import {
  clientKey,
  createRateLimiter,
  type RateLimitDecision,
  type RateLimiter,
  type TurnKind,
} from "./rate-limit";

const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const DAY = 24 * 60 * MINUTE;

const ALICE = "203.0.113.1";
const BOB = "203.0.113.2";

let time: number;
let limiter: RateLimiter;

function request(
  client: string,
  turn: TurnKind = "new-turn",
): RateLimitDecision {
  return limiter.check(client, turn);
}

/** Sends `count` requests at once and says whether every one was allowed. */
function sendAll(
  count: number,
  client: string,
  turn: TurnKind = "new-turn",
): void {
  for (let i = 0; i < count; i++) {
    expect(request(client, turn)).toBe("allowed");
  }
}

/** Sends `count` requests from different clients, 10 s apart so no minute limit is reached. */
function sendSpreadOverTime(count: number, turn: TurnKind = "new-turn"): void {
  for (let i = 0; i < count; i++) {
    expect(request(`client-${i}`, turn)).toBe("allowed");
    time += 10 * SECOND;
  }
}

// Spec 05, Decision 9 and T7.
beforeEach(() => {
  time = 0;
  limiter = createRateLimiter(() => time);
});

describe("createRateLimiter: one client's minute", () => {
  it("allows a client 8 requests in a minute", () => {
    sendAll(8, ALICE);
  });

  it("refuses the ninth as rate-limited", () => {
    sendAll(8, ALICE);

    expect(request(ALICE)).toBe("rate-limited");
  });

  it("does not hold one client's requests against another", () => {
    sendAll(8, ALICE);

    expect(request(BOB)).toBe("allowed");
  });

  it("allows the client again once the minute has passed", () => {
    sendAll(8, ALICE);
    time += MINUTE;

    expect(request(ALICE)).toBe("allowed");
  });

  it("counts the last minute, not the clock's", () => {
    time = 50 * SECOND;
    sendAll(8, ALICE);
    time = 70 * SECOND;

    expect(request(ALICE)).toBe("rate-limited");
  });

  it("does not count a refused request", () => {
    sendAll(8, ALICE);
    time += 30 * SECOND;

    for (let i = 0; i < 20; i++) {
      expect(request(ALICE)).toBe("rate-limited");
    }

    time += 30 * SECOND;

    expect(request(ALICE)).toBe("allowed");
  });
});

describe("createRateLimiter: everyone's minute", () => {
  it("allows 11 requests in a minute across clients", () => {
    for (let i = 0; i < 11; i++) {
      expect(request(`client-${i}`)).toBe("allowed");
    }
  });

  it("refuses the twelfth as rate-limited", () => {
    for (let i = 0; i < 11; i++) {
      request(`client-${i}`);
    }

    expect(request("one-more")).toBe("rate-limited");
  });

  it("allows requests again once the minute has passed", () => {
    for (let i = 0; i < 11; i++) {
      request(`client-${i}`);
    }

    time += MINUTE;

    expect(request("one-more")).toBe("allowed");
  });

  it("is not escaped by a forged address, which only escapes the client's own limit", () => {
    sendAll(8, ALICE);

    expect(request(ALICE)).toBe("rate-limited");

    sendAll(3, "forged-1");

    expect(request("forged-2")).toBe("rate-limited");
  });
});

describe("createRateLimiter: the day", () => {
  it("allows 400 requests in a day", () => {
    sendSpreadOverTime(400);
  });

  it("refuses the 401st as daily-limit", () => {
    sendSpreadOverTime(400);

    expect(request("one-more")).toBe("daily-limit");
  });

  it("says daily-limit before rate-limited when both apply", () => {
    sendSpreadOverTime(389);
    time += MINUTE;

    for (let i = 0; i < 11; i++) {
      expect(request(`burst-${i}`)).toBe("allowed");
    }

    expect(request(ALICE)).toBe("daily-limit");
  });

  it("allows requests again once the day has passed", () => {
    sendSpreadOverTime(400);
    time += DAY;

    expect(request("one-more")).toBe("allowed");
  });
});

// Spec 05, Decision 9: a turn with tools costs up to four requests, so a
// continuation after a tool result has `MAX_TOOL_CALLS` more to spend.
describe("createRateLimiter: a continuation after a tool result", () => {
  it("is allowed past a new turn's limit", () => {
    sendAll(8, ALICE);

    expect(request(ALICE, "new-turn")).toBe("rate-limited");
    expect(request(ALICE, "continuation")).toBe("allowed");
  });

  it("is allowed up to 11 for one client", () => {
    sendAll(8, ALICE);

    sendAll(3, ALICE, "continuation");
  });

  it("is refused past the ceiling", () => {
    sendAll(8, ALICE);
    sendAll(3, ALICE, "continuation");

    expect(request(ALICE, "continuation")).toBe("rate-limited");
  });

  it("has a global ceiling of 14 a minute", () => {
    for (let i = 0; i < 14; i++) {
      expect(request(`client-${i}`, "continuation")).toBe("allowed");
    }

    expect(request("one-more", "continuation")).toBe("rate-limited");
  });

  it("has a daily ceiling of 403", () => {
    sendSpreadOverTime(400);

    sendSpreadOverTime(3, "continuation");

    expect(request("one-more", "continuation")).toBe("daily-limit");
  });
});

// Spec 05, Decision 9: the client is the first address in `x-forwarded-for`.
describe("clientKey", () => {
  function headers(forwardedFor?: string): Headers {
    return new Headers(
      forwardedFor === undefined ? {} : { "x-forwarded-for": forwardedFor },
    );
  }

  it("is the first address of x-forwarded-for", () => {
    expect(clientKey(headers("203.0.113.9, 70.41.3.18, 150.172.238.178"))).toBe(
      "203.0.113.9",
    );
  });

  it("ignores the spaces around it", () => {
    expect(clientKey(headers("  203.0.113.9  ,70.41.3.18"))).toBe(
      "203.0.113.9",
    );
  });

  it("is unknown without the header, as when the app runs with no proxy in front", () => {
    expect(clientKey(headers())).toBe("unknown");
  });

  it("is unknown when the header is empty", () => {
    expect(clientKey(headers(" "))).toBe("unknown");
  });

  it("is the same for every request without the header, so they share one limit", () => {
    expect(clientKey(headers())).toBe(clientKey(headers()));
  });
});
