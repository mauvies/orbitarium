import type { LessonSession } from "./lesson-session";

/**
 * Holds the session outside React, so a read right after a change already
 * sees it: the tutor calls `launch` and then `current` in one go (spec 04,
 * "The lesson's controls"). Components read it with `useSyncExternalStore`.
 */
export type LessonStore = {
  readonly getSession: () => LessonSession;
  readonly subscribe: (listener: () => void) => () => void;
  readonly replace: (session: LessonSession) => void;
};

export function createLessonStore(initial: LessonSession): LessonStore {
  let session = initial;
  const listeners = new Set<() => void>();

  return {
    getSession: () => session,
    subscribe: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    replace: (next) => {
      if (next === session) {
        return;
      }

      session = next;

      for (const listener of listeners) {
        listener();
      }
    },
  };
}
