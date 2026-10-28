import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  type LanguageModel,
  safeValidateUIMessages,
  streamText,
  toUIMessageStream,
  type UIMessageChunk,
} from "ai";
import { parseTutorContext, type TutorContext } from "@/lib/tutor/context";
import {
  isConversationTooLong,
  MAX_LEARNER_MESSAGE_CHARACTERS,
} from "@/lib/tutor/limits";
import { type TutorMessage, tutorTools } from "@/lib/tutor/tools";
import { toErrorCode } from "./error-code";
import { tutorInstructions } from "./instructions";
import { isTutorAvailable } from "./model-id";
import { clientKey, type RateLimiter, type TurnKind } from "./rate-limit";
import { MAX_TOOL_CALLS, toolCallsSinceLearnerMessage } from "./tool-rounds";

export type TutorDependencies = {
  readonly timeoutMs: number;
  readonly rateLimiter: RateLimiter;
  readonly resolveModel: () => LanguageModel;
  readonly log: (message: string) => void;
};

type TutorRequest =
  | {
      readonly status: "valid";
      readonly messages: TutorMessage[];
      readonly context: TutorContext;
    }
  | { readonly status: "invalid"; readonly reason: string }
  | { readonly status: "too-long" };

/**
 * One turn of the conversation: validates the body, then streams the
 * model's answer as a UI message stream (spec 05, Decisions 2 and 3).
 */
export async function handleTutorRequest(
  request: Request,
  { resolveModel, log, timeoutMs, rateLimiter }: TutorDependencies,
): Promise<Response> {
  const tutorRequest = await readTutorRequest(request);
  if (tutorRequest.status === "invalid") {
    return new Response(tutorRequest.reason, { status: 400 });
  }
  if (tutorRequest.status === "too-long") {
    return new Response("too-long", { status: 400 });
  }
  const { messages, context } = tutorRequest;

  let model: LanguageModel;
  try {
    model = resolveModel();
  } catch (error) {
    log(`tutor: ${describe(error)}`);
    return new Response("unavailable", { status: 500 });
  }

  // Only a request that goes on to the model is counted (spec 05, Decision 9).
  const decision = rateLimiter.check(
    clientKey(request.headers),
    turnKind(messages),
  );
  if (decision !== "allowed") {
    return new Response(decision, { status: 429 });
  }

  const toolsUsedUp = toolCallsSinceLearnerMessage(messages) >= MAX_TOOL_CALLS;
  const result = streamText({
    model,
    instructions: tutorInstructions(context),
    messages: await convertToModelMessages(messages),
    tools: tutorTools,
    ...(toolsUsedUp ? { activeTools: [] } : {}),
    // A retried 429 spends quota and keeps the learner waiting for the same
    // error (spec 05, Decision 2).
    maxRetries: 0,
    abortSignal: request.signal,
    timeout: timeoutMs,
  });
  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      onError: (error) => {
        log(`tutor: ${describe(error)}`);
        return toErrorCode(error);
      },
    }).pipeThrough(timeoutAsError(log)),
  });
}

/**
 * A request that hits its timeout ends the stream with an `abort` chunk, which
 * the page reads as an empty answer, so it becomes `busy` (spec 05, Decision
 * 10). The learner may have left too, but then nobody reads the stream, so
 * any abort here is the timeout (Decision 2).
 */
function timeoutAsError(
  log: (message: string) => void,
): TransformStream<UIMessageChunk, UIMessageChunk> {
  return new TransformStream({
    transform(chunk, controller) {
      if (chunk.type === "abort") {
        log(`tutor: ${chunk.reason ?? "the request was aborted"}`);
        controller.enqueue({ type: "error", errorText: "busy" });
      } else {
        controller.enqueue(chunk);
      }
    },
  });
}

/** Whether the tutor is set up, from the environment alone (spec 05, Decision 12). */
export function handleAvailabilityRequest(
  environment: Readonly<Record<string, string | undefined>>,
): Response {
  return Response.json({ available: isTutorAvailable(environment) });
}

async function readTutorRequest(request: Request): Promise<TutorRequest> {
  const body: unknown = await request.json().catch(() => undefined);
  if (typeof body !== "object" || body === null) {
    return invalid("body must be a JSON object with messages and context");
  }
  if (!("messages" in body)) {
    return invalid("messages is missing");
  }
  if (!("context" in body)) {
    return invalid("context is missing");
  }

  const context = parseTutorContext(body.context);
  if (context.status === "invalid") {
    const field =
      context.field === "context" ? "context" : `context.${context.field}`;
    return invalid(`${field}: ${context.reason}`);
  }

  const messages = await safeValidateUIMessages<TutorMessage>({
    messages: body.messages,
    tools: tutorTools,
  });
  if (!messages.success) {
    return invalid(`messages: ${messages.error.message}`);
  }
  if (isConversationTooLong(messages.data.length)) {
    return { status: "too-long" };
  }
  if (messages.data.some(isTooLong)) {
    return invalid(
      `messages: a learner message is over ${MAX_LEARNER_MESSAGE_CHARACTERS} characters`,
    );
  }
  return { status: "valid", messages: messages.data, context: context.context };
}

/** A request that follows a tool result continues a turn; any other starts one. */
function turnKind(messages: readonly TutorMessage[]): TurnKind {
  return messages.at(-1)?.role === "user" ? "new-turn" : "continuation";
}

function isTooLong({ role, parts }: TutorMessage): boolean {
  return (
    role === "user" &&
    parts.some(
      (part) =>
        part.type === "text" &&
        part.text.length > MAX_LEARNER_MESSAGE_CHARACTERS,
    )
  );
}

function invalid(reason: string): TutorRequest {
  return { status: "invalid", reason };
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
