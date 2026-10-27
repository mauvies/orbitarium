import { tutorModel } from "./model";
import { handleTutorRequest } from "./tutor-handler";

// Spec 05, Decision 2.
export const maxDuration = 30;

export function POST(request: Request): Promise<Response> {
  return handleTutorRequest(request, {
    resolveModel: tutorModel,
    log: console.error,
  });
}
