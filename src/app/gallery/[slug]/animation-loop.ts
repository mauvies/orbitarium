export type AnimationLoop = {
  /** Runs one more frame, unless one is already pending. */
  readonly requestFrame: () => void;
  readonly stop: () => void;
};

/**
 * Calls `onFrame` on animation frames with the milliseconds since the
 * previous frame. It keeps going while `onFrame` returns true; otherwise it
 * waits for `requestFrame`, so a paused animation uses no CPU (spec 03,
 * Decision 5). The first frame after a start, a pause or a hidden tab gets 0,
 * so time never catches up (spec 03, Decision 11).
 */
export function startAnimationLoop(
  onFrame: (elapsedMs: number) => boolean,
): AnimationLoop {
  let pending: number | null = null;
  let lastTime: number | null = null;

  const runFrame = (time: number) => {
    pending = null;
    const keepGoing = onFrame(lastTime === null ? 0 : time - lastTime);
    lastTime = keepGoing ? time : null;
    if (keepGoing) {
      requestFrame();
    }
  };
  const requestFrame = () => {
    if (pending === null && !document.hidden) {
      pending = requestAnimationFrame(runFrame);
    }
  };
  const cancel = () => {
    if (pending !== null) {
      cancelAnimationFrame(pending);
    }
    pending = null;
    lastTime = null;
  };
  const onVisibilityChange = () => {
    if (document.hidden) {
      cancel();
    } else {
      requestFrame();
    }
  };

  document.addEventListener("visibilitychange", onVisibilityChange);
  requestFrame();
  return {
    requestFrame,
    stop: () => {
      cancel();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    },
  };
}
