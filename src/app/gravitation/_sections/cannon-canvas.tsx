"use client";

import { useLayoutEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import { es } from "@/content/es";
import { useLessonSession } from "../lesson-provider";
import { type CannonAnimation, startCannonAnimation } from "./cannon-animation";

const { canvasLabel } = es.gravitation.cannon;

/**
 * The cannon's canvas, which plays the last launch. React renders it only
 * when a launch is fired; the frames never go through React (spec 03,
 * Decision 5). With reduced motion the path is drawn whole at once (spec 04,
 * Decision 11).
 */
export function CannonCanvas() {
  const lastLaunch = useLessonSession().launches.at(-1);
  const reducedMotion = usePrefersReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<CannonAnimation | null>(null);

  // Layout effects, so the canvas is drawn before the first paint. This one
  // comes first, so the effect below finds the animation running.
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) {
      throw new Error("the cannon canvas is not mounted");
    }
    const animation = startCannonAnimation(canvas);
    animationRef.current = animation;
    return () => {
      animation.stop();
      animationRef.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    animationRef.current?.show(lastLaunch?.trace ?? null, !reducedMotion);
  }, [lastLaunch, reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={
        lastLaunch === undefined
          ? canvasLabel.idle
          : canvasLabel.launched(
              lastLaunch.settings.speedKmPerSecond,
              lastLaunch.settings.angleDegrees,
            )
      }
      className="mx-auto aspect-square w-full max-w-160 rounded-xl bg-bg-bottom"
    />
  );
}
