import type { TutorContext } from "@/lib/tutor/context";
import type { LessonControls } from "./lesson-controls";

/**
 * What the page tells the tutor, read from the controls when each request is
 * sent, the resend after a tool included (spec 05, Decision 4).
 */
export function tutorContext(controls: LessonControls): TutorContext {
  return {
    section: controls.navigation.current(),
    cannon: controls.cannon.current(),
    profile: controls.learnerProfile(),
  };
}
