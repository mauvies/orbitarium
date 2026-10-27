import { describe, expect, it } from "vitest";
import { CANNON_LIMITS, CANNON_PRESETS } from "@/cannon";
import { createLessonControls, type LessonView } from "./lesson-controls";
import { answerQuestion, initialSession } from "./lesson-session";
import { createLessonStore } from "./lesson-store";
import type { SectionId } from "./section-ids";

// Spec 04, Decisions 12 to 14: the API the tutor will use in spec 05. The
// view stands in for the page: scrolling makes the part the one at the top.
function controlsWith({
  atTop = "falling",
  cannonInView = false,
}: {
  atTop?: SectionId;
  cannonInView?: boolean;
} = {}) {
  const scrolledTo: SectionId[] = [];
  let top = atTop;
  const view: LessonView = {
    scrollToSection: (section) => {
      scrolledTo.push(section);
      top = section;
    },
    sectionAtTop: () => top,
    isCannonInView: () => cannonInView,
  };
  const store = createLessonStore(initialSession());
  return { controls: createLessonControls(store, view), scrolledTo };
}

// A view that never moves, for tests that do not navigate.
const STILL_VIEW: LessonView = {
  scrollToSection: () => {},
  sectionAtTop: () => "falling",
  isCannonInView: () => true,
};

describe("createLessonControls", () => {
  it("reads a launch's result at once, as the tutor needs", () => {
    const { controls } = controlsWith({ cannonInView: true });
    const escapePreset = CANNON_PRESETS.escape;

    controls.cannon.launch(escapePreset);

    expect(controls.cannon.current()).toEqual({
      settings: escapePreset,
      lastLaunch: { ...escapePreset, outcome: "escape" },
    });
  });

  it("has no last launch before the first one", () => {
    expect(controlsWith().controls.cannon.current().lastLaunch).toBeNull();
  });

  it("a launch from another part moves to the cannon", () => {
    const { controls, scrolledTo } = controlsWith({ atTop: "moon" });

    controls.cannon.launch({ speedKmPerSecond: 8 });

    expect(scrolledTo).toEqual(["cannon"]);
    expect(controls.navigation.current()).toBe("cannon");
  });

  it("a launch with the cannon in view does not scroll", () => {
    const { controls, scrolledTo } = controlsWith({
      atTop: "orbit",
      cannonInView: true,
    });

    controls.cannon.launch({ speedKmPerSecond: 8 });

    expect(scrolledTo).toEqual([]);
  });

  it("a rejected launch does not scroll", () => {
    const { controls, scrolledTo } = controlsWith({ atTop: "moon" });

    const result = controls.cannon.launch({ speedKmPerSecond: Number.NaN });

    expect(result.status).toBe("rejected");
    expect(scrolledTo).toEqual([]);
  });

  it("setting the cannon never scrolls", () => {
    const { controls, scrolledTo } = controlsWith({ atTop: "moon" });

    controls.cannon.set({ speedKmPerSecond: 8 });

    expect(scrolledTo).toEqual([]);
  });

  it("rejects an unknown part", () => {
    const { controls, scrolledTo } = controlsWith();

    expect(controls.navigation.goToSection("prediction")).toEqual({
      status: "rejected",
      field: "section",
      reason: "must be one of falling, mutual, moon, orbit, cannon, law",
    });
    expect(controls.navigation.goToSection(3)).toMatchObject({
      status: "rejected",
    });
    expect(scrolledTo).toEqual([]);
  });

  it("goToSection navigates for a valid part only", () => {
    const { controls, scrolledTo } = controlsWith();

    expect(controls.navigation.goToSection("law")).toEqual({
      status: "moved",
      section: "law",
    });
    controls.navigation.goToSection("nowhere");

    expect(scrolledTo).toEqual(["law"]);
  });

  it("current() is the part at the top of the viewport", () => {
    expect(controlsWith({ atTop: "orbit" }).controls.navigation.current()).toBe(
      "orbit",
    );
  });

  it("reads the learner profile, read-only", () => {
    const store = createLessonStore(
      answerQuestion(initialSession(), "twice-as-far", "quarter"),
    );
    const controls = createLessonControls(store, STILL_VIEW);

    expect(
      controls
        .learnerProfile()
        .find(({ question }) => question === "twice-as-far")?.result,
    ).toEqual({ status: "correct" });
  });

  it("exposes the limits and the parts the tutor may ask for", () => {
    const { controls } = controlsWith();

    expect(controls.cannon.limits).toBe(CANNON_LIMITS);
    expect(controls.navigation.sections).toEqual([
      "falling",
      "mutual",
      "moon",
      "orbit",
      "cannon",
      "law",
    ]);
  });
});
