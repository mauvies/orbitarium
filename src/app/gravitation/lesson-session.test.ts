import { describe, expect, it } from "vitest";
import { CANNON_PRESETS, type CannonRequest } from "@/cannon";
import {
  answerQuestion,
  clearEarlierPaths,
  initialSession,
  type LessonSession,
  launchCannon,
  RECENT_LAUNCHES,
  setCannon,
  setPredictedPathShown,
} from "./lesson-session";

// Spec 04, Decisions 2, 11 and 12.
const START = initialSession();
const ELLIPTICAL = CANNON_PRESETS["elliptical-orbit"];

function launched(session: LessonSession, request: CannonRequest) {
  const { session: next, result } = launchCannon(session, request);
  if (result.status !== "launched") {
    throw new Error(`expected a launch, got ${result.reason}`);
  }
  return next;
}

describe("setCannon", () => {
  it("changes the settings without launching", () => {
    const { session, result } = setCannon(START, { speedKmPerSecond: 9.5 });

    expect(result).toEqual({
      status: "set",
      speedKmPerSecond: 9.5,
      angleDegrees: START.cannon.angleDegrees,
      altitudeKm: START.cannon.altitudeKm,
      clamped: [],
    });
    expect(session.cannon.speedKmPerSecond).toBe(9.5);
    expect(session.launches).toEqual([]);
  });

  it("a rejected request changes nothing", () => {
    const { session, result } = setCannon(START, { angleDegrees: "up" });

    expect(result.status).toBe("rejected");
    expect(session).toBe(START);
  });
});

describe("launchCannon", () => {
  it("applies the request, then records the launch with its outcome", () => {
    const { session, result } = launchCannon(START, {
      speedKmPerSecond: 50,
    });

    expect(result).toEqual({
      status: "launched",
      speedKmPerSecond: 15,
      angleDegrees: START.cannon.angleDegrees,
      altitudeKm: START.cannon.altitudeKm,
      clamped: ["speedKmPerSecond"],
      outcome: "escape",
    });
    expect(session.cannon.speedKmPerSecond).toBe(15);
    expect(session.launches.at(-1)).toMatchObject({
      settings: { speedKmPerSecond: 15 },
      outcome: "escape",
    });
  });

  it("launches the current settings when the request is empty", () => {
    const set = setCannon(START, ELLIPTICAL).session;
    const { result } = launchCannon(set, {});

    expect(result).toMatchObject({
      ...ELLIPTICAL,
      outcome: "elliptical-orbit",
    });
  });

  it("traces the launch until it leaves the view or closes", () => {
    const launch = launched(START, ELLIPTICAL).launches.at(-1);

    expect(launch?.trace.end).toBe("period");
    expect(launch?.trace.points[0]).toEqual({ x: 0, y: expect.any(Number) });
  });

  it("a rejected launch changes nothing", () => {
    const { session, result } = launchCannon(START, {
      speedKmPerSecond: Number.NaN,
    });

    expect(result.status).toBe("rejected");
    expect(session).toBe(START);
  });

  it(`keeps the last ${RECENT_LAUNCHES} launches, newest last, with distinct ids`, () => {
    const speeds = [6, 6.5, 7, 7.5, 8, 8.5, 9];
    const session = speeds.reduce(
      (current, speedKmPerSecond) =>
        launched(current, { speedKmPerSecond, angleDegrees: 0 }),
      START,
    );
    const kept = session.launches;

    expect(kept.map((launch) => launch.settings.speedKmPerSecond)).toEqual(
      speeds.slice(-RECENT_LAUNCHES),
    );
    expect(new Set(kept.map((launch) => launch.id)).size).toBe(RECENT_LAUNCHES);
  });
});

// Spec 04, L24: a learner preference, not one of the tutor's controls.
describe("setPredictedPathShown", () => {
  it("the predicted path starts shown", () => {
    expect(START.showPredictedPath).toBe(true);
  });

  it("hiding the predicted path changes nothing else", () => {
    const hidden = setPredictedPathShown(START, false);

    expect(hidden.showPredictedPath).toBe(false);
    expect({ ...hidden, showPredictedPath: true }).toEqual(START);
  });

  it("showing it again restores the session", () => {
    const shown = setPredictedPathShown(
      setPredictedPathShown(START, false),
      true,
    );

    expect(shown).toEqual(START);
  });
});

describe("clearEarlierPaths", () => {
  it("keeps only the last launch, which the tutor still reads", () => {
    const twoLaunches = launched(
      launched(START, CANNON_PRESETS.ballistic),
      ELLIPTICAL,
    );
    const last = twoLaunches.launches.at(-1);

    expect(clearEarlierPaths(twoLaunches).launches).toEqual([last]);
  });

  it("changes nothing without earlier paths", () => {
    const oneLaunch = launched(START, ELLIPTICAL);

    expect(clearEarlierPaths(START)).toBe(START);
    expect(clearEarlierPaths(oneLaunch)).toBe(oneLaunch);
  });
});

describe("answerQuestion", () => {
  it("records the answer", () => {
    const session = answerQuestion(START, "two-falls", "centre");

    expect(session.answers).toEqual({ "two-falls": "centre" });
  });

  it("a question keeps its first answer", () => {
    const first = answerQuestion(START, "two-falls", "south-pole");

    expect(answerQuestion(first, "two-falls", "centre")).toBe(first);
    expect(first.answers["two-falls"]).toBe("south-pole");
  });

  it("rejects an option the question does not have", () => {
    expect(() => answerQuestion(START, "two-falls", "half")).toThrow(
      RangeError,
    );
  });
});
