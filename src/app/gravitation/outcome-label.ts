import type { Launch } from "./lesson-session";

/**
 * Whether a shot that comes back left through the stop radius first, so its
 * path ends at the corner of the view like an escape's. Its label then says
 * that it comes back (spec 04, Decision 11). Decided by where the trace
 * stopped, not by a speed: the boundary depends on the angle.
 */
export function returnsFromBeyondView({
  outcome,
  trace,
}: Pick<Launch, "outcome" | "trace">): boolean {
  return trace.end === "stop-radius" && outcome !== "escape";
}
