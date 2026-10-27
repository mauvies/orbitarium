import { describe, expect, it } from "vitest";
import { CANNON_PRESETS } from "@/cannon";
import type { SectionId } from "@/lib/lesson/section-ids";
import { createLessonControls, type LessonView } from "./lesson-controls";
import { initialSession } from "./lesson-session";
import { createLessonStore } from "./lesson-store";
import {
  runGoToSection,
  runLaunchCannon,
  runSetCannon,
} from "./run-tutor-tool";

const START = CANNON_PRESETS.ballistic;

/** The lesson's controls on a page with the cannon in view. */
function lessonControls() {
  let top: SectionId = "cannon";
  const view: LessonView = {
    scrollToSection: (section) => {
      top = section;
    },
    focusHeading: () => {},
    announceSection: () => {},
    isTutorOpen: () => true,
    sectionAtTop: () => top,
    isCannonInView: () => true,
  };
  return createLessonControls(createLessonStore(initialSession()), view);
}

// Spec 05, Decision 6 and T4: each tool goes through its control, and its
// result goes back unchanged.
describe("the tutor's tools", () => {
  it("setCannon moves the controls and returns what was applied", () => {
    const controls = lessonControls();

    expect(runSetCannon(controls, { speedKmPerSecond: 8 })).toEqual({
      status: "set",
      ...START,
      speedKmPerSecond: 8,
      clamped: [],
    });
    expect(controls.cannon.current().settings.speedKmPerSecond).toBe(8);
    expect(controls.cannon.current().lastLaunch).toBeNull();
  });

  it("launchCannon fires and returns the outcome", () => {
    const controls = lessonControls();

    expect(runLaunchCannon(controls, CANNON_PRESETS.escape)).toEqual({
      status: "launched",
      ...CANNON_PRESETS.escape,
      outcome: "escape",
      clamped: [],
    });
    expect(controls.cannon.current().lastLaunch?.outcome).toBe("escape");
  });

  it("goToSection moves to the part", () => {
    const controls = lessonControls();

    expect(runGoToSection(controls, { section: "moon" })).toEqual({
      status: "moved",
      section: "moon",
    });
    expect(controls.navigation.current()).toBe("moon");
  });

  it("a speed of 50 km/s comes back clamped", () => {
    expect(
      runSetCannon(lessonControls(), { speedKmPerSecond: 50 }),
    ).toMatchObject({
      status: "set",
      speedKmPerSecond: 15,
      clamped: ["speedKmPerSecond"],
    });
  });

  it("a speed given as text is rejected by the controller", () => {
    const controls = lessonControls();

    expect(runLaunchCannon(controls, { speedKmPerSecond: "8" })).toMatchObject({
      status: "rejected",
      field: "speedKmPerSecond",
    });
    expect(controls.cannon.current().lastLaunch).toBeNull();
  });

  it("a part that does not exist is rejected", () => {
    expect(
      runGoToSection(lessonControls(), { section: "the-sun" }),
    ).toMatchObject({ status: "rejected", field: "section" });
  });
});
