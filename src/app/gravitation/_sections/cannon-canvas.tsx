"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import { es } from "@/content/es";
import { useLessonSession } from "../lesson-provider";
import type { Launch } from "../lesson-session";
import { returnsFromBeyondView } from "../outcome-label";
import { type CannonAnimation, startCannonAnimation } from "./cannon-animation";

const { cannon } = es.gravitation;

/**
 * The cannon's canvas, which plays the last launch over the earlier ones,
 * and the label of its outcome. React renders it only when a launch is fired
 * or its outcome shows; the frames never go through React (spec 03,
 * Decision 5). With reduced motion the path is drawn whole at once (spec 04,
 * Decision 11).
 */
export function CannonCanvas() {
  const { launches } = useLessonSession();
  const lastLaunch = launches.at(-1);
  const earlierPaths = useMemo(
    () => launches.slice(0, -1).map(({ trace }) => trace),
    [launches],
  );
  const reducedMotion = usePrefersReducedMotion();
  const [shownLaunchId, setShownLaunchId] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<CannonAnimation | null>(null);
  const playingLaunchId = useRef<number | null>(null);

  // Layout effects, so the canvas is drawn before the first paint. This one
  // comes first, so the effects below find the animation running.
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) {
      throw new Error("the cannon canvas is not mounted");
    }
    const animation = startCannonAnimation(canvas, () =>
      setShownLaunchId(playingLaunchId.current),
    );
    animationRef.current = animation;
    return () => {
      animation.stop();
      animationRef.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    animationRef.current?.setEarlierPaths(earlierPaths);
  }, [earlierPaths]);

  useLayoutEffect(() => {
    playingLaunchId.current = lastLaunch?.id ?? null;
    animationRef.current?.show(lastLaunch?.trace ?? null, !reducedMotion);
  }, [lastLaunch, reducedMotion]);

  const shownLaunch =
    lastLaunch !== undefined && lastLaunch.id === shownLaunchId
      ? lastLaunch
      : null;

  return (
    <div className="relative mx-auto w-full max-w-160">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={
          lastLaunch === undefined
            ? cannon.canvasLabel.idle
            : cannon.canvasLabel.launched(
                lastLaunch.settings.speedKmPerSecond,
                lastLaunch.settings.angleDegrees,
              )
        }
        className="block aspect-square w-full rounded-xl bg-bg-bottom"
      />
      <OutcomeLabel launch={shownLaunch} />
    </div>
  );
}

/**
 * The outcome, once it can be seen: a label on the canvas, and a polite live
 * region that says it (spec 04, Decision 11). The region is always there, so
 * screen readers announce the change.
 */
function OutcomeLabel({ launch }: { launch: Launch | null }) {
  const outcome = launch === null ? null : cannon.outcomes[launch.outcome];
  const fromAfar = launch !== null && returnsFromBeyondView(launch);
  return (
    <>
      <p
        data-testid="cannon-outcome"
        aria-hidden="true"
        className={`absolute top-3 left-3 max-w-[calc(100%-1.5rem)] rounded-[10px] border border-line bg-surface px-3 py-1.5 font-semibold text-small text-strong ${outcome === null ? "invisible" : ""}`}
      >
        {outcome === null ? "" : cannon.outcomeLabel(outcome.label, fromAfar)}
      </p>
      <output className="sr-only">
        {outcome === null
          ? ""
          : cannon.outcomeAnnouncement(outcome.announced, fromAfar)}
      </output>
    </>
  );
}
