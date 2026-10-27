import { describe, expect, it } from "vitest";
import { CANNON_PRESETS } from "@/cannon";
import { parseTutorContext } from "@/lib/tutor/context";
import { createLessonControls, type LessonView } from "./lesson-controls";
import { initialSession } from "./lesson-session";
import { createLessonStore } from "./lesson-store";
import { tutorContext } from "./tutor-context";

// The page with the cannon in view, as the tutor's launches need it.
const AT_THE_CANNON: LessonView = {
  scrollToSection: () => {},
  focusHeading: () => {},
  announceSection: () => {},
  isTutorOpen: () => true,
  sectionAtTop: () => "cannon",
  isCannonInView: () => true,
};

function lessonControls() {
  return createLessonControls(
    createLessonStore(initialSession()),
    AT_THE_CANNON,
  );
}

// Spec 05, Decision 4 and T3: the context is read from the controls each
// time a request is sent.
describe("tutorContext", () => {
  it("gives the part at the top, the cannon and the profile", () => {
    const controls = lessonControls();

    expect(tutorContext(controls)).toEqual({
      section: "cannon",
      cannon: controls.cannon.current(),
      profile: controls.learnerProfile(),
    });
  });

  it("carries the latest launch", () => {
    const controls = lessonControls();
    controls.cannon.launch(CANNON_PRESETS.escape);

    expect(tutorContext(controls).cannon.lastLaunch).toEqual({
      ...CANNON_PRESETS.escape,
      outcome: "escape",
    });
  });

  it("is a context the route accepts", () => {
    const controls = lessonControls();
    controls.cannon.launch(CANNON_PRESETS["elliptical-orbit"]);

    expect(parseTutorContext(tutorContext(controls)).status).toBe("valid");
  });
});
