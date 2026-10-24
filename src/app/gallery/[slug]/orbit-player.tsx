"use client";

import { useState } from "react";
import { es } from "@/content/es";
import type { OrbitPath } from "@/drawing/orbit-path";
import type { OrbitPreset } from "@/orbits";
import { OrbitCanvas } from "./orbit-canvas";
import { DEFAULT_SPEED } from "./speed";
import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

/** The animated orbit and its play button. */
export function OrbitPlayer({
  orbit,
  path,
}: {
  orbit: OrbitPreset;
  path: OrbitPath;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [playChoice, setPlayChoice] = useState<boolean | null>(null);
  // Spec 03, Decision 11: reduced motion only decides how playback starts.
  const playing = playChoice ?? !prefersReducedMotion;
  return (
    <div className="grid justify-items-start gap-4">
      <OrbitCanvas
        orbit={orbit}
        path={path}
        label={es.detail.player.canvasLabel(es.orbits[orbit.slug].name)}
        playing={playing}
        speed={DEFAULT_SPEED}
        correction={true}
      />
      <button
        type="button"
        onClick={() => setPlayChoice(!playing)}
        className="rounded-[10px] bg-accent px-4 py-2 text-bg-bottom"
      >
        {playing ? es.detail.player.pause : es.detail.player.play}
      </button>
    </div>
  );
}
