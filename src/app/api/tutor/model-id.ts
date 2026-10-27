const KEY_VARIABLE = "GOOGLE_GENERATIVE_AI_API_KEY";
const MODEL_VARIABLE = "TUTOR_MODEL";
const PROVIDER_PREFIX = "google:";

/** The tutor's model in the AI SDK registry's syntax, `provider:model`. */
export type TutorModelId = `google:${string}`;

/**
 * The model the environment names, checked before any request reaches it
 * (spec 05, Decision 1). Throws naming the variable that is missing or
 * wrong, never falls back to a default.
 */
export function tutorModelId(
  environment: Readonly<Record<string, string | undefined>>,
): TutorModelId {
  if (isUnset(environment[KEY_VARIABLE])) {
    throw new Error(
      `${KEY_VARIABLE} is not set: the tutor needs a Google AI Studio key`,
    );
  }
  const modelId = environment[MODEL_VARIABLE];
  if (modelId === undefined || isUnset(modelId)) {
    throw new Error(
      `${MODEL_VARIABLE} is not set: it names the model as ${PROVIDER_PREFIX}<model>`,
    );
  }
  if (!isGoogleModel(modelId)) {
    throw new Error(
      `${MODEL_VARIABLE} must name a model as ${PROVIDER_PREFIX}<model>, got "${modelId}"`,
    );
  }
  return modelId;
}

function isUnset(value: string | undefined): boolean {
  return value === undefined || value.trim() === "";
}

function isGoogleModel(value: string): value is TutorModelId {
  return (
    value.startsWith(PROVIDER_PREFIX) && value.length > PROVIDER_PREFIX.length
  );
}
