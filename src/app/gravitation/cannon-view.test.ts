import { describe, expect, it } from "vitest";
import { CANNON_PRESETS, launchState, traceLaunch } from "@/cannon";
import { CANNON_STOP_RADIUS, CANNON_VIEW_RADIUS } from "./cannon-view";

// Spec 04, L9: the long ellipse stands for a transfer orbit and is seen whole.
describe("the cannon's view", () => {
  it("shows the long ellipse preset whole", () => {
    const { points, end } = traceLaunch(
      launchState(CANNON_PRESETS["long-ellipse"]),
      { stopRadius: CANNON_STOP_RADIUS },
    );
    const outside = points.filter(
      ({ x, y }) =>
        Math.abs(x) > CANNON_VIEW_RADIUS || Math.abs(y) > CANNON_VIEW_RADIUS,
    );

    expect(end).toBe("period");
    expect(outside).toEqual([]);
  });
});
