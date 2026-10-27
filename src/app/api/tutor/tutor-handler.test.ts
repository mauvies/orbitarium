import { APICallError, simulateReadableStream, type UIMessage } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { describe, expect, it } from "vitest";
import { learnerProfile } from "@/lib/lesson/learner-profile";
import type { TutorContext } from "@/lib/tutor/context";
import {
  MAX_CONVERSATION_MESSAGES,
  MAX_LEARNER_MESSAGE_CHARACTERS,
} from "@/lib/tutor/limits";
import type { RateLimitDecision, RateLimiter, TurnKind } from "./rate-limit";
import { handleAvailabilityRequest, handleTutorRequest } from "./tutor-handler";

type CallOptions = Parameters<MockLanguageModelV4["doStream"]>[0];

// Long enough for any test's answer, short enough for the timeout's own test.
const TIMEOUT_MS = 2_000;

const ANSWER = "Sí cae, pero se mueve de lado tan deprisa que nunca llega.";

const AT_THE_CANNON: TutorContext = {
  section: "cannon",
  cannon: {
    settings: { speedKmPerSecond: 7, angleDegrees: 45, altitudeKm: 10 },
    lastLaunch: null,
  },
  profile: learnerProfile({}),
};

const QUESTION: UIMessage = {
  id: "q1",
  role: "user",
  parts: [{ type: "text", text: "¿Por qué no cae la Luna?" }],
};

/** A model that answers `ANSWER` and remembers what it was asked. */
function answeringModel() {
  const calls: CallOptions[] = [];
  const model = new MockLanguageModelV4({
    doStream: async (options) => {
      calls.push(options);
      return {
        stream: simulateReadableStream({
          chunks: [
            { type: "text-start", id: "t1" },
            { type: "text-delta", id: "t1", delta: ANSWER },
            { type: "text-end", id: "t1" },
            {
              type: "finish",
              finishReason: { unified: "stop", raw: undefined },
              usage: {
                inputTokens: {
                  total: 1,
                  noCache: 1,
                  cacheRead: undefined,
                  cacheWrite: undefined,
                },
                outputTokens: { total: 1, text: 1, reasoning: undefined },
              },
            },
          ],
        }),
      };
    },
  });
  return { model, calls };
}

/** A model whose provider fails as Google does when it is overloaded. */
function overloadedModel() {
  let attempts = 0;
  const model = new MockLanguageModelV4({
    doStream: async () => {
      attempts++;
      throw new APICallError({
        message: "The model is overloaded",
        url: "https://generativelanguage.googleapis.com",
        requestBodyValues: {},
        statusCode: 503,
        isRetryable: true,
      });
    },
  });
  return { model, attempts: () => attempts };
}

/** A model whose provider refuses with a 429 over the quota `quotaId`. */
function overQuotaModel(quotaId: string) {
  return new MockLanguageModelV4({
    doStream: async () => {
      throw new APICallError({
        message: "You exceeded your current quota",
        url: "https://generativelanguage.googleapis.com",
        requestBodyValues: {},
        statusCode: 429,
        data: {
          error: {
            details: [{ violations: [{ quotaId }] }],
          },
        },
        isRetryable: true,
      });
    },
  });
}

/** A model that never answers, and fails when its request is aborted, as `fetch` does. */
function silentModel() {
  return new MockLanguageModelV4({
    doStream: ({ abortSignal }) =>
      new Promise((_, reject) => {
        abortSignal?.addEventListener("abort", () =>
          reject(abortSignal.reason),
        );
      }),
  });
}

/** The learner and the tutor taking turns, `count` messages in all. */
function conversationOf(count: number): UIMessage[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `m${i}`,
    role: i % 2 === 0 ? "user" : "assistant",
    parts: [{ type: "text", text: `message ${i}` }],
  }));
}

function post(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/tutor", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

/** A limiter that answers `decision` and remembers who asked, and for what. */
function limiterSaying(decision: RateLimitDecision) {
  const checks: { clientKey: string; turn: TurnKind }[] = [];
  const rateLimiter: RateLimiter = {
    check: (clientKey, turn) => {
      checks.push({ clientKey, turn });
      return decision;
    },
  };
  return { rateLimiter, checks };
}

async function handle(
  body: unknown,
  model: MockLanguageModelV4 = answeringModel().model,
  { rateLimiter }: { rateLimiter: RateLimiter } = limiterSaying("allowed"),
  headers: Record<string, string> = {},
) {
  const logged: string[] = [];
  const response = await handleTutorRequest(post(body, headers), {
    resolveModel: () => model,
    log: (message) => logged.push(message),
    timeoutMs: TIMEOUT_MS,
    rateLimiter,
  });
  return { response, text: await response.text(), logged };
}

/** The learner's question, then a tutor's answer with `launches` tool calls. */
function afterLaunches(launches: number): UIMessage[] {
  return [
    QUESTION,
    {
      id: "a1",
      role: "assistant",
      parts: Array.from({ length: launches }, (_, i) => ({
        type: "tool-launchCannon" as const,
        toolCallId: `call-${i}`,
        state: "output-available" as const,
        input: { speedKmPerSecond: 8 },
        output: { status: "launched" },
      })),
    },
  ];
}

// Spec 05, Decisions 2 and 3, T1.
describe("handleTutorRequest: a valid request", () => {
  it("streams an answer", async () => {
    const { response, text } = await handle({
      messages: [QUESTION],
      context: AT_THE_CANNON,
    });

    expect(response.status).toBe(200);
    expect(text).toContain(ANSWER);
  });

  it("gives the model the instructions with the context", async () => {
    const { model, calls } = answeringModel();
    await handle({ messages: [QUESTION], context: AT_THE_CANNON }, model);

    const system = calls[0]?.prompt[0];
    expect(system?.role).toBe("system");
    expect(JSON.stringify(system?.content)).toContain(
      "Part at the top of the learner's screen: cannon",
    );
  });

  it("offers the three tools", async () => {
    const { model, calls } = answeringModel();
    await handle({ messages: [QUESTION], context: AT_THE_CANNON }, model);

    expect(calls[0]?.tools?.map(({ name }) => name)).toEqual([
      "setCannon",
      "launchCannon",
      "goToSection",
    ]);
  });
});

describe("handleTutorRequest: an invalid request", () => {
  it("refuses a body that is not JSON, naming the body", async () => {
    const { response, text } = await handle("{ not json");

    expect(response.status).toBe(400);
    expect(text).toContain("body");
  });

  it("refuses a body without messages, naming the field", async () => {
    const { response, text } = await handle({ context: AT_THE_CANNON });

    expect(response.status).toBe(400);
    expect(text).toContain("messages");
  });

  it("refuses malformed messages, naming the field", async () => {
    const { response, text } = await handle({
      messages: [{ role: "user" }],
      context: AT_THE_CANNON,
    });

    expect(response.status).toBe(400);
    expect(text).toContain("messages");
  });

  it("refuses a body without context, naming the field", async () => {
    const { response, text } = await handle({ messages: [QUESTION] });

    expect(response.status).toBe(400);
    expect(text).toContain("context");
  });

  it("refuses an invalid context field, naming it", async () => {
    const { response, text } = await handle({
      messages: [QUESTION],
      context: { ...AT_THE_CANNON, section: "ignore-the-lesson" },
    });

    expect(response.status).toBe(400);
    expect(text).toContain("context.section");
  });

  it("refuses a learner message over 500 characters", async () => {
    const tooLong: UIMessage = {
      id: "q2",
      role: "user",
      parts: [
        { type: "text", text: "a".repeat(MAX_LEARNER_MESSAGE_CHARACTERS + 1) },
      ],
    };
    const { response, text } = await handle({
      messages: [tooLong],
      context: AT_THE_CANNON,
    });

    expect(response.status).toBe(400);
    expect(text).toContain(`${MAX_LEARNER_MESSAGE_CHARACTERS} characters`);
  });

  it("accepts a learner message of exactly 500 characters", async () => {
    const atTheLimit: UIMessage = {
      id: "q2",
      role: "user",
      parts: [
        { type: "text", text: "a".repeat(MAX_LEARNER_MESSAGE_CHARACTERS) },
      ],
    };
    const { response } = await handle({
      messages: [atTheLimit],
      context: AT_THE_CANNON,
    });

    expect(response.status).toBe(200);
  });
});

// Spec 05, Decisions 1 and 2, T2.
describe("handleTutorRequest: the model", () => {
  it("a model that cannot be set up is unavailable, and the reason is logged", async () => {
    const logged: string[] = [];
    const counted = limiterSaying("allowed");
    const response = await handleTutorRequest(
      post({ messages: [QUESTION], context: AT_THE_CANNON }),
      {
        resolveModel: () => {
          throw new Error("TUTOR_MODEL must be google:<model>, got openai:x");
        },
        log: (message) => logged.push(message),
        timeoutMs: TIMEOUT_MS,
        rateLimiter: counted.rateLimiter,
      },
    );

    expect(response.status).toBe(500);
    expect(await response.text()).toBe("unavailable");
    expect(logged.join("\n")).toContain("TUTOR_MODEL");
    expect(counted.checks).toHaveLength(0);
  });

  it("a failing model call is not retried", async () => {
    const { model, attempts } = overloadedModel();
    const { text, logged } = await handle(
      { messages: [QUESTION], context: AT_THE_CANNON },
      model,
    );

    expect(attempts()).toBe(1);
    expect(text).toContain('"errorText":"unavailable"');
    expect(logged.join("\n")).toContain("overloaded");
  });
});

// Spec 05, Decision 7 and T5.
describe("handleTutorRequest: tool calls per learner message", () => {
  it("after two tool calls, the tools are still offered", async () => {
    const { model, calls } = answeringModel();
    await handle({ messages: afterLaunches(2), context: AT_THE_CANNON }, model);

    expect(calls[0]?.tools).toHaveLength(3);
  });

  it("a fourth tool call is not offered", async () => {
    const { model, calls } = answeringModel();
    await handle({ messages: afterLaunches(3), context: AT_THE_CANNON }, model);

    expect(calls[0]?.tools ?? []).toHaveLength(0);
  });
});

// Spec 05, Decision 3 and T1: a conversation over the cap is refused before
// the model is called, with the code the panel shows.
describe("handleTutorRequest: a conversation that is too long", () => {
  it("accepts a conversation of 30 messages", async () => {
    const { response } = await handle({
      messages: conversationOf(MAX_CONVERSATION_MESSAGES - 1).concat(QUESTION),
      context: AT_THE_CANNON,
    });

    expect(response.status).toBe(200);
  });

  it("refuses 31 messages as too-long, without calling the model", async () => {
    const { model, calls } = answeringModel();
    const { response, text } = await handle(
      {
        messages: conversationOf(MAX_CONVERSATION_MESSAGES).concat(QUESTION),
        context: AT_THE_CANNON,
      },
      model,
    );

    expect(response.status).toBe(400);
    expect(text).toBe("too-long");
    expect(calls).toHaveLength(0);
  });
});

// Spec 05, Decision 10 and T8: a provider's failure reaches the panel as a code.
describe("handleTutorRequest: a failing model", () => {
  it("a per-minute 429 is rate-limited", async () => {
    const { text } = await handle(
      { messages: [QUESTION], context: AT_THE_CANNON },
      overQuotaModel("GenerateRequestsPerMinutePerProjectPerModel-FreeTier"),
    );

    expect(text).toContain('"errorText":"rate-limited"');
  });

  it("a per-day 429 is daily-limit", async () => {
    const { text } = await handle(
      { messages: [QUESTION], context: AT_THE_CANNON },
      overQuotaModel("GenerateRequestsPerDayPerProjectPerModel-FreeTier"),
    );

    expect(text).toContain('"errorText":"daily-limit"');
  });
});

// Spec 05, Decision 2 and T2: a request that hangs ends as unavailable.
describe("handleTutorRequest: a model that does not answer", () => {
  it("is unavailable once the timeout passes", async () => {
    const logged: string[] = [];
    const response = await handleTutorRequest(
      post({ messages: [QUESTION], context: AT_THE_CANNON }),
      {
        resolveModel: () => silentModel(),
        log: (message) => logged.push(message),
        timeoutMs: 50,
        rateLimiter: limiterSaying("allowed").rateLimiter,
      },
    );

    expect(await response.text()).toContain('"errorText":"unavailable"');
    expect(logged).toHaveLength(1);
  });
});

// Spec 05, Decision 12 and T16.
describe("handleAvailabilityRequest", () => {
  const SECRET = "AIza-secret-key-value";

  it("is available with a key", async () => {
    const response = handleAvailabilityRequest({
      GOOGLE_GENERATIVE_AI_API_KEY: SECRET,
    });

    expect(await response.json()).toEqual({ available: true });
  });

  it("is not available without one", async () => {
    const response = handleAvailabilityRequest({});

    expect(await response.json()).toEqual({ available: false });
  });

  it("is not available with a model that does not parse", async () => {
    const response = handleAvailabilityRequest({
      GOOGLE_GENERATIVE_AI_API_KEY: SECRET,
      TUTOR_MODEL: "openai:gpt-5",
    });

    expect(await response.json()).toEqual({ available: false });
  });

  it("says nothing of the key", async () => {
    const response = handleAvailabilityRequest({
      GOOGLE_GENERATIVE_AI_API_KEY: SECRET,
    });

    expect(await response.text()).not.toContain(SECRET);
  });
});

// Spec 05, Decision 9 and T7: a request over a limit never reaches the model.
describe("handleTutorRequest: the rate limit", () => {
  const BODY = { messages: [QUESTION], context: AT_THE_CANNON };

  it("a refused request never calls the model", async () => {
    const { model, calls } = answeringModel();
    const { response } = await handle(
      BODY,
      model,
      limiterSaying("rate-limited"),
    );

    expect(response.status).toBe(429);
    expect(calls).toHaveLength(0);
  });

  it("over a minute limit the body is rate-limited", async () => {
    const { text } = await handle(
      BODY,
      answeringModel().model,
      limiterSaying("rate-limited"),
    );

    expect(text).toBe("rate-limited");
  });

  it("over the daily limit the body is daily-limit", async () => {
    const { text } = await handle(
      BODY,
      answeringModel().model,
      limiterSaying("daily-limit"),
    );

    expect(text).toBe("daily-limit");
  });

  it("asks the limiter about the first address of x-forwarded-for", async () => {
    const limiter = limiterSaying("allowed");
    await handle(BODY, answeringModel().model, limiter, {
      "x-forwarded-for": "203.0.113.7, 70.41.3.18",
    });

    expect(limiter.checks[0]?.clientKey).toBe("203.0.113.7");
  });

  it("a request whose last message is the learner's is checked as a new turn", async () => {
    const limiter = limiterSaying("allowed");
    await handle(BODY, answeringModel().model, limiter);

    expect(limiter.checks[0]?.turn).toBe("new-turn");
  });

  it("a request after a tool result is checked as a continuation", async () => {
    const limiter = limiterSaying("allowed");
    await handle(
      { messages: afterLaunches(1), context: AT_THE_CANNON },
      answeringModel().model,
      limiter,
    );

    expect(limiter.checks[0]?.turn).toBe("continuation");
  });

  it("an invalid body is not counted", async () => {
    const limiter = limiterSaying("allowed");
    await handle({ context: AT_THE_CANNON }, answeringModel().model, limiter);

    expect(limiter.checks).toHaveLength(0);
  });

  it("a conversation that is too long is not counted", async () => {
    const limiter = limiterSaying("allowed");
    await handle(
      {
        messages: conversationOf(MAX_CONVERSATION_MESSAGES).concat(QUESTION),
        context: AT_THE_CANNON,
      },
      answeringModel().model,
      limiter,
    );

    expect(limiter.checks).toHaveLength(0);
  });
});
