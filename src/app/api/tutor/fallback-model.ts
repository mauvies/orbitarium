import { APICallError, wrapLanguageModel } from "ai";
import { isServerError } from "./error-code";

// `ai` does not export the provider's model types, so they are read off
// `wrapLanguageModel`, which takes and returns one.
type ProviderModel = ReturnType<typeof wrapLanguageModel>;
type CallOptions = Parameters<ProviderModel["doStream"]>[0];
type StreamResult = Awaited<ReturnType<ProviderModel["doStream"]>>;
type StreamPart =
  StreamResult["stream"] extends ReadableStream<infer Part> ? Part : never;

const CONTENT_PARTS: ReadonlySet<StreamPart["type"]> = new Set([
  "text-delta",
  "tool-input-start",
  "tool-call",
]);

const SILENCE = Symbol("silence");

export type FallbackOptions = {
  /** How long the first model has to start answering. */
  readonly silenceMs: number;
  readonly log: (message: string) => void;
};

type FirstAttempt =
  | { readonly status: "started"; readonly result: StreamResult }
  | { readonly status: "overloaded"; readonly reason: string };

export function withFallback(
  primary: ProviderModel,
  fallback: ProviderModel,
  { silenceMs, log }: FallbackOptions,
): ProviderModel {
  return wrapLanguageModel({
    model: primary,
    middleware: {
      wrapStream: async ({ model, params }) => {
        const attempt = await firstAttempt(model, params, silenceMs);
        if (attempt.status === "started") return attempt.result;
        log(`tutor: falling back to ${fallback.modelId}: ${attempt.reason}`);
        return fallback.doStream(params);
      },
    },
  });
}

async function firstAttempt(
  model: ProviderModel,
  params: CallOptions,
  silenceMs: number,
): Promise<FirstAttempt> {
  const ownAbort = new AbortController();
  const abortSignal =
    params.abortSignal === undefined
      ? ownAbort.signal
      : AbortSignal.any([params.abortSignal, ownAbort.signal]);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const silence = new Promise<typeof SILENCE>((resolve) => {
    timer = setTimeout(() => resolve(SILENCE), silenceMs);
  });
  const overloaded = (reason: string): FirstAttempt => {
    ownAbort.abort(new Error(reason));
    return { status: "overloaded", reason };
  };

  const call = Promise.resolve(model.doStream({ ...params, abortSignal }));
  // Once silence wins the race, the aborted call rejects with nobody waiting.
  call.catch(() => {});
  try {
    const result = await Promise.race([call, silence]);
    if (result === SILENCE) {
      return overloaded(`no answer within ${silenceMs} ms`);
    }
    const reader = result.stream.getReader();
    const read: StreamPart[] = [];
    for (;;) {
      const next = await Promise.race([reader.read(), silence]);
      if (next === SILENCE) {
        await reader.cancel();
        return overloaded(`no answer within ${silenceMs} ms`);
      }
      if (next.done) {
        return {
          status: "started",
          result: { ...result, stream: replay(read, reader) },
        };
      }
      const part = next.value;
      if (part.type === "error" && isOverloaded(part.error)) {
        await reader.cancel();
        return overloaded(describe(part.error));
      }
      read.push(part);
      if (CONTENT_PARTS.has(part.type)) {
        return {
          status: "started",
          result: { ...result, stream: replay(read, reader) },
        };
      }
    }
  } catch (error) {
    if (isOverloaded(error)) {
      return overloaded(describe(error));
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

/** The parts already read, then the rest of the stream. */
function replay(
  read: readonly StreamPart[],
  reader: ReadableStreamDefaultReader<StreamPart>,
): ReadableStream<StreamPart> {
  return new ReadableStream({
    start(controller) {
      for (const part of read) {
        controller.enqueue(part);
      }
    },
    async pull(controller) {
      const next = await reader.read();
      if (next.done) {
        controller.close();
      } else {
        controller.enqueue(next.value);
      }
    },
    cancel: (reason) => reader.cancel(reason),
  });
}

function isOverloaded(error: unknown): boolean {
  return APICallError.isInstance(error) && isServerError(error);
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
