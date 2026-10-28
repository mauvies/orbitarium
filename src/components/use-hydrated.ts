import { useSyncExternalStore } from "react";

/**
 * False on the server and during hydration, true afterwards. Controls stay
 * disabled until then, so a click before the page hydrates is never lost.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
}

function subscribeToNothing(): () => void {
  return () => {};
}
