import { APICallError, simulateReadableStream } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { describe, expect, it } from "vitest";
import { withFallback } from "./fallback-model";

type CallOptions = Parameters<MockLanguageModelV4["doStream"]>[0];
type StreamResult = Awaited<ReturnType<MockLanguageModelV4["doStream"]>>;

type StreamPart =
  StreamResult["stream"] extends ReadableStream<infer Part> ? Part : never;

// Short, so a test waits for the silence in milliseconds, not seconds.
const SILENCE_MS = 20;

const PRIMARY_ANSWER = "Respuesta del modelo principal.";
const FALLBACK_ANSWER = "Respuesta del modelo de respaldo.";

const QUESTION: CallOptions = {
  prompt: [{ role: "user", content: [{ type: "text", text: "¿Por qué?" }] }],
};

function textParts(text: string): StreamPart[] {
  return [
    { type: "stream-start", warnings: [] },
    { type: "text-start", id: "t1" },
    { type: "text-delta", id: "t1", delta: text },
    { type: "text-end", id: "t1" },
  ];
}

/** A model that answers `text`, counting its calls. */
function answering(modelId: string, text: string) {
  let calls = 0;

  const model = new MockLanguageModelV4({
    modelId,
    doStream: async () => {
      calls++;

      return { stream: simulateReadableStream({ chunks: textParts(text) }) };
    },
  });

  return { model, calls: () => calls };
}

function providerError(statusCode: number): APICallError {
  return new APICallError({
    message: `provider answered ${statusCode}`,
    url: "https://generativelanguage.googleapis.com",
    requestBodyValues: {},
    statusCode,
    isRetryable: statusCode === 429 || statusCode >= 500,
  });
}

/** A model whose provider refuses the request with `statusCode`. */
function failing(statusCode: number) {
  return new MockLanguageModelV4({
    doStream: async () => {
      throw providerError(statusCode);
    },
  });
}

/** A model that never answers, and fails when its request is aborted, as `fetch` does. */
function silent() {
  const aborted: boolean[] = [];

  const model = new MockLanguageModelV4({
    doStream: ({ abortSignal }) =>
      new Promise((_, reject) => {
        abortSignal?.addEventListener("abort", () => {
          aborted.push(true);
          reject(abortSignal.reason);
        });
      }),
  });

  return { model, aborted };
}

/** A model whose stream opens but sends `parts` and then nothing more. */
function stalling(parts: readonly StreamPart[]) {
  return new MockLanguageModelV4({
    doStream: async () => ({
      stream: new ReadableStream<StreamPart>({
        start(controller) {
          for (const part of parts) {
            controller.enqueue(part);
          }
        },
      }),
    }),
  });
}

async function textOf({ stream }: StreamResult): Promise<string> {
  const reader = stream.getReader();
  let text = "";

  for (let next = await reader.read(); !next.done; next = await reader.read()) {
    if (next.value.type === "text-delta") {
      text += next.value.delta;
    }
  }

  return text;
}

function setUp(primary: MockLanguageModelV4) {
  const fallback = answering("fallback-model", FALLBACK_ANSWER);
  const logged: string[] = [];

  const model = withFallback(primary, fallback.model, {
    silenceMs: SILENCE_MS,
    log: (message) => logged.push(message),
  });

  return { model, fallbackCalls: fallback.calls, logged };
}

// Spec 05, Decision 2 and T18.
describe("withFallback", () => {
  it("a 503 is answered by the fallback", async () => {
    const { model } = setUp(failing(503));

    expect(await textOf(await model.doStream(QUESTION))).toBe(FALLBACK_ANSWER);
  });

  it("a 503 inside the stream, before any content, is answered by the fallback", async () => {
    const { model } = setUp(
      stalling([
        { type: "stream-start", warnings: [] },
        { type: "error", error: providerError(503) },
      ]),
    );

    expect(await textOf(await model.doStream(QUESTION))).toBe(FALLBACK_ANSWER);
  });

  it("silence past the limit is answered by the fallback", async () => {
    const primary = silent();
    const { model } = setUp(primary.model);

    expect(await textOf(await model.doStream(QUESTION))).toBe(FALLBACK_ANSWER);
    expect(primary.aborted).toEqual([true]);
  });

  it("a stream with no content past the limit is answered by the fallback", async () => {
    const { model } = setUp(stalling([{ type: "stream-start", warnings: [] }]));

    expect(await textOf(await model.doStream(QUESTION))).toBe(FALLBACK_ANSWER);
  });

  it("an answer that starts in time is kept", async () => {
    const { model, fallbackCalls } = setUp(
      answering("primary-model", PRIMARY_ANSWER).model,
    );

    expect(await textOf(await model.doStream(QUESTION))).toBe(PRIMARY_ANSWER);
    expect(fallbackCalls()).toBe(0);
  });

  it("a 429 is not sent to the fallback", async () => {
    const { model, fallbackCalls } = setUp(failing(429));

    await expect(model.doStream(QUESTION)).rejects.toThrow(
      "provider answered 429",
    );
    expect(fallbackCalls()).toBe(0);
  });

  it("a 400 is not sent to the fallback", async () => {
    const { model, fallbackCalls } = setUp(failing(400));

    await expect(model.doStream(QUESTION)).rejects.toThrow(
      "provider answered 400",
    );
    expect(fallbackCalls()).toBe(0);
  });

  it("the fallback's failure is the request's", async () => {
    const model = withFallback(failing(503), failing(500), {
      silenceMs: SILENCE_MS,
      log: () => {},
    });

    await expect(model.doStream(QUESTION)).rejects.toThrow(
      "provider answered 500",
    );
  });

  it("the fallback is logged", async () => {
    const { model, logged } = setUp(failing(503));

    await model.doStream(QUESTION);

    expect(logged).toEqual([
      "tutor: falling back to fallback-model: provider answered 503",
    ]);
  });
});
