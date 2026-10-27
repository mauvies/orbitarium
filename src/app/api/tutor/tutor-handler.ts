import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  type LanguageModel,
  safeValidateUIMessages,
  streamText,
  toUIMessageStream,
} from "ai";
import { parseTutorContext, type TutorContext } from "@/lib/tutor/context";
import { MAX_LEARNER_MESSAGE_CHARACTERS } from "@/lib/tutor/limits";
import { type TutorMessage, tutorTools } from "@/lib/tutor/tools";
import { tutorInstructions } from "./instructions";
import { MAX_TOOL_CALLS, toolCallsSinceLearnerMessage } from "./tool-rounds";

export type TutorDependencies = {
  /** Throws, naming the variable, when the model is not configured. */
  readonly resolveModel: () => LanguageModel;
  readonly log: (message: string) => void;
};

type TutorRequest =
  | {
      readonly status: "valid";
      readonly messages: TutorMessage[];
      readonly context: TutorContext;
    }
  | { readonly status: "invalid"; readonly reason: string };

/**
 * One turn of the conversation: validates the body, then streams the
 * model's answer as a UI message stream (spec 05, Decisions 2 and 3).
 */
export async function handleTutorRequest(
  request: Request,
  { resolveModel, log }: TutorDependencies,
): Promise<Response> {
  const tutorRequest = await readTutorRequest(request);
  if (tutorRequest.status === "invalid") {
    return new Response(tutorRequest.reason, { status: 400 });
  }
  const { messages, context } = tutorRequest;

  let model: LanguageModel;
  try {
    model = resolveModel();
  } catch (error) {
    log(`tutor: ${describe(error)}`);
    return new Response("unavailable", { status: 500 });
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
  });
  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      onError: (error) => {
        log(`tutor: ${describe(error)}`);
        return "unavailable";
      },
    }),
  });
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
  if (messages.data.some(isTooLong)) {
    return invalid(
      `messages: a learner message is over ${MAX_LEARNER_MESSAGE_CHARACTERS} characters`,
    );
  }
  return { status: "valid", messages: messages.data, context: context.context };
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
