import { tutorModel } from "./model";
import { handleAvailabilityRequest, handleTutorRequest } from "./tutor-handler";

// Spec 05, Decision 2.
export const maxDuration = 30;
const TIMEOUT_MS = 20_000;

export function GET(): Response {
  return handleAvailabilityRequest(process.env);
}

export function POST(request: Request): Promise<Response> {
  return handleTutorRequest(request, {
    resolveModel: tutorModel,
    log: console.error,
    timeoutMs: TIMEOUT_MS,
  });
}
