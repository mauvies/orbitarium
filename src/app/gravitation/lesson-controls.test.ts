import { describe, expect, it } from "vitest";
import { CANNON_LIMITS, CANNON_PRESETS } from "@/cannon";
import { createLessonControls } from "./lesson-controls";
import { initialSession } from "./lesson-session";
import { createLessonStore } from "./lesson-store";
import type { StepId } from "./steps";

// Spec 04, Decisions 12 and 14: the API the page's buttons and spec 05's
// tutor share.
function controlsAt(step: StepId) {
  const visited: StepId[] = [];
  const store = createLessonStore(initialSession(step));
  const controls = createLessonControls(store, (next) => visited.push(next));
  return { controls, visited };
}

describe("createLessonControls", () => {
  it("reads a launch's result at once, as the tutor needs", () => {
    const { controls } = controlsAt("cannon");
    const escapePreset = CANNON_PRESETS.escape;

    controls.cannon.launch(escapePreset);

    expect(controls.cannon.current()).toEqual({
      settings: escapePreset,
      lastLaunch: { ...escapePreset, outcome: "escape" },
    });
  });

  it("has no last launch before the first one", () => {
    expect(
      controlsAt("cannon").controls.cannon.current().lastLaunch,
    ).toBeNull();
  });

  it("a launch from another step navigates to the cannon once", () => {
    const { controls, visited } = controlsAt("moon");

    controls.cannon.launch({ speedKmPerSecond: 8 });

    expect(visited).toEqual(["cannon"]);
    expect(controls.navigation.current()).toBe("cannon");
  });

  it("goToStep navigates for a new step only", () => {
    const { controls, visited } = controlsAt("falling");

    controls.navigation.goToStep("falling");
    controls.navigation.goToStep("law");
    controls.navigation.goToStep("nowhere");

    expect(visited).toEqual(["law"]);
  });

  it("exposes the limits and the steps the tutor may ask for", () => {
    const { controls } = controlsAt("falling");

    expect(controls.cannon.limits).toBe(CANNON_LIMITS);
    expect(controls.navigation.steps).toEqual([
      "falling",
      "mutual",
      "moon",
      "cannon",
      "law",
    ]);
  });
});
