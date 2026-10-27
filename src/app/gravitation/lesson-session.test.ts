import { describe, expect, it } from "vitest";
import { CANNON_PRESETS, type CannonRequest } from "@/cannon";
import {
  answerQuestion,
  clearEarlierPaths,
  goToStep,
  initialSession,
  type LessonSession,
  launchCannon,
  RECENT_LAUNCHES,
  setCannon,
  syncStep,
} from "./lesson-session";

// Spec 04, L11 and Decisions 12 to 14.
const AT_FALLING = initialSession("falling");
const AT_CANNON = initialSession("cannon");
const ELLIPTICAL = CANNON_PRESETS["elliptical-orbit"];

function launched(session: LessonSession, request: CannonRequest) {
  const { session: next, result } = launchCannon(session, request);
  if (result.status !== "launched") {
    throw new Error(`expected a launch, got ${result.reason}`);
  }
  return next;
}

describe("goToStep", () => {
  it("rejects an unknown step", () => {
    const { session, result, navigateTo } = goToStep(AT_FALLING, "prediction");

    expect(result).toEqual({
      status: "rejected",
      field: "step",
      reason: "must be one of falling, mutual, moon, orbit, cannon, law",
    });
    expect(session).toBe(AT_FALLING);
    expect(navigateTo).toBeNull();
  });

  it("moves to a step and asks for a history entry, as a link does", () => {
    const { session, result, navigateTo } = goToStep(AT_FALLING, "moon");

    expect(result).toEqual({ status: "moved", step: "moon" });
    expect(session.step).toBe("moon");
    expect(navigateTo).toBe("moon");
  });

  it("moving to the current step adds no history entry", () => {
    const { result, navigateTo } = goToStep(AT_FALLING, "falling");

    expect(result).toEqual({ status: "moved", step: "falling" });
    expect(navigateTo).toBeNull();
  });
});

describe("syncStep", () => {
  it("takes the step from the URL, after a link or the Back button", () => {
    expect(syncStep(AT_FALLING, "law").step).toBe("law");
  });
});

describe("setCannon", () => {
  it("changes the settings without launching", () => {
    const { session, result } = setCannon(AT_CANNON, { speedKmPerSecond: 9.5 });

    expect(result).toEqual({
      status: "set",
      speedKmPerSecond: 9.5,
      angleDegrees: AT_CANNON.cannon.angleDegrees,
      altitudeKm: AT_CANNON.cannon.altitudeKm,
      clamped: [],
    });
    expect(session.cannon.speedKmPerSecond).toBe(9.5);
    expect(session.launches).toEqual([]);
  });

  it("a rejected request changes nothing", () => {
    const { session, result } = setCannon(AT_CANNON, { angleDegrees: "up" });

    expect(result.status).toBe("rejected");
    expect(session).toBe(AT_CANNON);
  });
});

describe("launchCannon", () => {
  it("applies the request, then records the launch with its outcome", () => {
    const { session, result } = launchCannon(AT_CANNON, {
      speedKmPerSecond: 50,
    });

    expect(result).toEqual({
      status: "launched",
      speedKmPerSecond: 15,
      angleDegrees: AT_CANNON.cannon.angleDegrees,
      altitudeKm: AT_CANNON.cannon.altitudeKm,
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
    const set = setCannon(AT_CANNON, ELLIPTICAL).session;
    const { result } = launchCannon(set, {});

    expect(result).toMatchObject({
      ...ELLIPTICAL,
      outcome: "elliptical-orbit",
    });
  });

  it("traces the launch until it leaves the view or closes", () => {
    const launch = launched(AT_CANNON, ELLIPTICAL).launches.at(-1);

    expect(launch?.trace.end).toBe("period");
    expect(launch?.trace.points[0]).toEqual({ x: 0, y: expect.any(Number) });
  });

  it("a launch from another step moves to the cannon", () => {
    const { session, navigateTo } = launchCannon(AT_FALLING, ELLIPTICAL);

    expect(session.step).toBe("cannon");
    expect(navigateTo).toBe("cannon");
  });

  it("a launch from the cannon step stays there", () => {
    expect(launchCannon(AT_CANNON, ELLIPTICAL).navigateTo).toBeNull();
  });

  it("a rejected launch changes nothing and does not move", () => {
    const { session, result, navigateTo } = launchCannon(AT_FALLING, {
      speedKmPerSecond: Number.NaN,
    });

    expect(result.status).toBe("rejected");
    expect(session).toBe(AT_FALLING);
    expect(navigateTo).toBeNull();
  });

  it(`keeps the last ${RECENT_LAUNCHES} launches, newest last, with distinct ids`, () => {
    const speeds = [6, 6.5, 7, 7.5, 8, 8.5, 9];
    const session = speeds.reduce(
      (current, speedKmPerSecond) =>
        launched(current, { speedKmPerSecond, angleDegrees: 0 }),
      AT_CANNON,
    );
    const kept = session.launches;

    expect(kept.map((launch) => launch.settings.speedKmPerSecond)).toEqual(
      speeds.slice(-RECENT_LAUNCHES),
    );
    expect(new Set(kept.map((launch) => launch.id)).size).toBe(RECENT_LAUNCHES);
  });
});

describe("clearEarlierPaths", () => {
  it("keeps only the last launch, which the tutor still reads", () => {
    const twoLaunches = launched(
      launched(AT_CANNON, CANNON_PRESETS.ballistic),
      ELLIPTICAL,
    );
    const last = twoLaunches.launches.at(-1);

    expect(clearEarlierPaths(twoLaunches).launches).toEqual([last]);
  });

  it("changes nothing without earlier paths", () => {
    const oneLaunch = launched(AT_CANNON, ELLIPTICAL);

    expect(clearEarlierPaths(AT_CANNON)).toBe(AT_CANNON);
    expect(clearEarlierPaths(oneLaunch)).toBe(oneLaunch);
  });
});

describe("answerQuestion", () => {
  it("records the answer", () => {
    const session = answerQuestion(AT_FALLING, "two-falls", "centre");

    expect(session.answers).toEqual({ "two-falls": "centre" });
  });

  it("a question keeps its first answer", () => {
    const first = answerQuestion(AT_FALLING, "two-falls", "south-pole");

    expect(answerQuestion(first, "two-falls", "centre")).toBe(first);
    expect(first.answers["two-falls"]).toBe("south-pole");
  });

  it("rejects an option the question does not have", () => {
    expect(() => answerQuestion(AT_FALLING, "two-falls", "half")).toThrow(
      RangeError,
    );
  });
});
