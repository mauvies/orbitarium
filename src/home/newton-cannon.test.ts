import { describe, expect, it } from "vitest";
import type { Vec2 } from "@/physics";
import {
  cannonTrajectory,
  circularSpeed,
  EARTH_RADIUS,
  LAUNCH_POINT,
} from "./newton-cannon";

const radius = ({ x, y }: Vec2) => Math.hypot(x, y);
const launchRadius = radius(LAUNCH_POINT);
// Far above Yoshida's error at 2,000 steps per turn, far below a pixel.
const CIRCLE_TOLERANCE = 1e-4;

describe("cannonTrajectory", () => {
  it("starts at the cannon", () => {
    const [start] = cannonTrajectory(0.5 * circularSpeed);

    expect(start).toEqual(LAUNCH_POINT);
  });

  it("falls back to the surface when the shot is slower than an orbit", () => {
    const trajectory = cannonTrajectory(0.6 * circularSpeed);
    const end = trajectory.at(-1);

    expect(end && radius(end)).toBeLessThanOrEqual(EARTH_RADIUS);
    expect(trajectory.slice(0, -1).every((p) => radius(p) > EARTH_RADIUS)).toBe(
      true,
    );
  });

  it("circles at the launch height at the circular speed", () => {
    const trajectory = cannonTrajectory(circularSpeed);

    for (const point of trajectory) {
      expect(Math.abs(radius(point) - launchRadius)).toBeLessThan(
        CIRCLE_TOLERANCE,
      );
    }
  });

  it("swings out beyond the launch height and back when faster", () => {
    const trajectory = cannonTrajectory(1.08 * circularSpeed);
    const farthest = Math.max(...trajectory.map(radius));
    const end = trajectory.at(-1);

    expect(farthest).toBeGreaterThan(1.3 * launchRadius);
    expect(
      end && Math.hypot(end.x - LAUNCH_POINT.x, end.y - LAUNCH_POINT.y),
    ).toBeLessThan(0.05);
  });

  it.each([
    0,
    -1,
    Number.NaN,
  ])("rejects a launch speed of %s naming the field", (speed) => {
    const call = () => cannonTrajectory(speed);

    expect(call).toThrow(RangeError);
    expect(call).toThrow(/launchSpeed/);
  });
});
