import { APICallError, simulateReadableStream, type UIMessage } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { describe, expect, it } from "vitest";
import { learnerProfile } from "@/lib/lesson/learner-profile";
import type { TutorContext } from "@/lib/tutor/context";
import { MAX_LEARNER_MESSAGE_CHARACTERS } from "@/lib/tutor/limits";
import { handleTutorRequest } from "./tutor-handler";

type CallOptions = Parameters<MockLanguageModelV4["doStream"]>[0];

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

function post(body: unknown): Request {
  return new Request("http://localhost/api/tutor", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

async function handle(
  body: unknown,
  model: MockLanguageModelV4 = answeringModel().model,
) {
  const logged: string[] = [];
  const response = await handleTutorRequest(post(body), {
    resolveModel: () => model,
    log: (message) => logged.push(message),
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
    const response = await handleTutorRequest(
      post({ messages: [QUESTION], context: AT_THE_CANNON }),
      {
        resolveModel: () => {
          throw new Error("TUTOR_MODEL must be google:<model>, got openai:x");
        },
        log: (message) => logged.push(message),
      },
    );

    expect(response.status).toBe(500);
    expect(await response.text()).toBe("unavailable");
    expect(logged.join("\n")).toContain("TUTOR_MODEL");
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
