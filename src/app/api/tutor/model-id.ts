/** The tutor's model in the AI SDK registry's syntax, `provider:model`. */
export type TutorModelId = `google:${string}`;

type Environment = Readonly<Record<string, string | undefined>>;

type TutorSetup =
  | { readonly status: "ready"; readonly model: TutorModelId }
  | { readonly status: "misconfigured"; readonly reason: string };

const KEY_VARIABLE = "GOOGLE_GENERATIVE_AI_API_KEY";
const MODEL_VARIABLE = "TUTOR_MODEL";
const PROVIDER_PREFIX = "google:";

// `.env.example` repeats it (spec 05, Decision 1).
export const DEFAULT_TUTOR_MODEL: TutorModelId = "google:gemini-3.5-flash-lite";

// Spec 05, Decision 2: asked once when the tutor's model is overloaded.
export const FALLBACK_TUTOR_MODEL: TutorModelId =
  "google:gemini-3.1-flash-lite";

/**
 * The model the environment names, checked before any request reaches it
 * (spec 05, Decision 1). Throws naming the variable that is missing or
 * wrong; only a `TUTOR_MODEL` that is not set at all gets the default.
 */
export function tutorModelId(environment: Environment): TutorModelId {
  const setup = tutorSetup(environment);

  if (setup.status === "misconfigured") {
    throw new Error(setup.reason);
  }

  return setup.model;
}

/** Whether the tutor can answer: what `GET /api/tutor` says (spec 05, Decision 12). */
export function isTutorAvailable(environment: Environment): boolean {
  return tutorSetup(environment).status === "ready";
}

function tutorSetup(environment: Environment): TutorSetup {
  if (isUnset(environment[KEY_VARIABLE])) {
    return misconfigured(
      `${KEY_VARIABLE} is not set: the tutor needs a Google AI Studio key`,
    );
  }

  const modelId = environment[MODEL_VARIABLE];

  if (modelId === undefined || isUnset(modelId)) {
    return { status: "ready", model: DEFAULT_TUTOR_MODEL };
  }

  if (!isGoogleModel(modelId)) {
    return misconfigured(
      `${MODEL_VARIABLE} must name a model as ${PROVIDER_PREFIX}<model>, got "${modelId}"`,
    );
  }

  return { status: "ready", model: modelId };
}

function misconfigured(reason: string): TutorSetup {
  return { status: "misconfigured", reason };
}

function isUnset(value: string | undefined): boolean {
  return value === undefined || value.trim() === "";
}

function isGoogleModel(value: string): value is TutorModelId {
  return (
    value.startsWith(PROVIDER_PREFIX) && value.length > PROVIDER_PREFIX.length
  );
}
