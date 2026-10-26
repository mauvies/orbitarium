import type { FrameControls } from "./orbit-frame";
import { DEFAULT_SPEED } from "./speed";

/**
 * How the reader likes to watch an orbit. The gallery layout keeps them, so
 * they carry over from one orbit to the next (spec 03, Decision 10).
 */
export type DetailPreferences = FrameControls & {
  readonly showPath: boolean;
  readonly showTrail: boolean;
};

export const DEFAULT_DETAIL_PREFERENCES: DetailPreferences = {
  speed: DEFAULT_SPEED,
  showPath: true,
  showTrail: true,
  correction: true,
};
