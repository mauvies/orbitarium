import "server-only";
import { google } from "@ai-sdk/google";
import { createProviderRegistry, type LanguageModel } from "ai";
import { SLOW_ANSWER_MS } from "@/lib/tutor/limits";
import { withFallback } from "./fallback-model";
import { FALLBACK_TUTOR_MODEL, tutorModelId } from "./model-id";

// The provider reads its key from GOOGLE_GENERATIVE_AI_API_KEY, which
// `server-only` keeps out of any browser bundle (spec 05, Decisions 1 and 2).
const registry = createProviderRegistry({ google });

export function tutorModel(): LanguageModel {
  return withFallback(
    registry.languageModel(tutorModelId(process.env)),
    registry.languageModel(FALLBACK_TUTOR_MODEL),
    { silenceMs: SLOW_ANSWER_MS, log: console.error },
  );
}
