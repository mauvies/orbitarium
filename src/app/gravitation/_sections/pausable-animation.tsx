"use client";

import { type ReactNode, useState } from "react";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import { es } from "@/content/es";

const { animation } = es.gravitation;

/**
 * An animation that loops on its own can be paused (WCAG 2.2.2: moving
 * content that starts by itself and lasts over 5 s). With reduced motion
 * nothing moves, so there is no button. `width` matches the illustration's,
 * so the button sits at the drawing's own corner.
 */
export function PausableAnimation({
  buttonAt = "bottom-right",
  width,
  children,
}: {
  buttonAt?: "top-left" | "bottom-right";
  width: string;
  children: ReactNode;
}) {
  const [paused, setPaused] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  return (
    <div className={`relative mx-auto ${width}`}>
      <div className={paused ? "[&_*]:[animation-play-state:paused]" : ""}>
        {children}
      </div>
      {!reducedMotion && (
        <button
          type="button"
          aria-pressed={paused}
          onClick={() => setPaused(!paused)}
          className={`absolute rounded-lg border border-line px-2 py-1 text-muted text-small hover:text-strong ${buttonAt === "top-left" ? "top-0 left-0" : "right-0 bottom-0"}`}
        >
          {paused ? animation.resume : animation.pause}
        </button>
      )}
    </div>
  );
}
