"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { launchRadius } from "@/cannon";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import { es } from "@/content/es";
import { useLessonSession } from "../lesson-provider";
import { type CannonAnimation, startCannonAnimation } from "./cannon-animation";
import { CannonOutcomeLabel } from "./cannon-outcome-label";
import { ReferenceSpeedBadges } from "./reference-speed-badges";

const { cannon } = es.gravitation;

/**
 * The cannon's canvas, which plays the last launch over the earlier ones,
 * and the label of its outcome. React renders it only when a launch is fired
 * or its outcome shows; the frames never go through React (spec 03,
 * Decision 5). With reduced motion the path is drawn whole at once (spec 04,
 * Decision 11).
 */
export function CannonCanvas() {
  const { launches, cannon: settings } = useLessonSession();
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
    animationRef.current?.setLaunchRadius(launchRadius(settings.altitudeKm));
  }, [settings.altitudeKm]);

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
                lastLaunch.settings.altitudeKm,
              )
        }
        className="block aspect-square w-full rounded-xl bg-bg-bottom"
      />
      <ReferenceSpeedBadges altitudeKm={settings.altitudeKm} />
      <CannonOutcomeLabel launch={shownLaunch} />
    </div>
  );
}
