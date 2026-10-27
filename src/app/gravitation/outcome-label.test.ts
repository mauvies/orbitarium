import { describe, expect, it } from "vitest";
import type { CannonRequest } from "@/cannon";
import { initialSession, type Launch, launchCannon } from "./lesson-session";
import { returnsFromBeyondView } from "./outcome-label";

// Spec 04, Decision 11: a shot that will come back but passes the stop
// radius, the corner of the view, would otherwise look like an escape. The
// session starts on Newton's mountain, 10 km up.
function launchOf(request: CannonRequest): Launch {
  const launch = launchCannon(initialSession("cannon"), request).session
    .launches[0];
  if (launch === undefined) {
    throw new Error("expected a launch");
  }
  return launch;
}

describe("returnsFromBeyondView", () => {
  it("marks an elliptical orbit that passes the stop radius", () => {
    const farEllipse = launchOf({ speedKmPerSecond: 10.5, angleDegrees: 0 });

    expect(farEllipse.outcome).toBe("elliptical-orbit");
    expect(returnsFromBeyondView(farEllipse)).toBe(true);
  });

  it("does not mark an elliptical orbit that closes inside the stop radius", () => {
    const ellipse = launchOf({ speedKmPerSecond: 10, angleDegrees: 0 });

    expect(ellipse.outcome).toBe("elliptical-orbit");
    expect(returnsFromBeyondView(ellipse)).toBe(false);
  });

  it("marks a shot straight up that passes the stop radius and falls back", () => {
    const highLob = launchOf({ speedKmPerSecond: 10.5, angleDegrees: 90 });

    expect(highLob.outcome).toBe("ballistic");
    expect(returnsFromBeyondView(highLob)).toBe(true);
  });

  it("never marks an escape", () => {
    expect(
      returnsFromBeyondView(
        launchOf({ speedKmPerSecond: 12, angleDegrees: 0 }),
      ),
    ).toBe(false);
  });
});
