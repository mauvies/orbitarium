import { useSyncExternalStore } from "react";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/**
 * Whether the reader asked for reduced motion. The server cannot know, so it
 * answers yes: the page renders paused and hydration never mismatches
 * (spec 03, Decision 11).
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => matchMedia(REDUCED_MOTION).matches,
    () => true,
  );
}

function subscribe(onChange: () => void): () => void {
  const query = matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
