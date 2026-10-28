"use client";

import { useCallback, useState } from "react";
import { useHydrated } from "@/components/use-hydrated";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import { es } from "@/content/es";
import type { OrbitPath } from "@/drawing/orbit-path";
import type { OrbitPreset } from "@/orbits";
import { useGallerySession } from "../gallery-session";
import { OrbitCanvas } from "./orbit-canvas";
import { PlayerControls } from "./player-controls";

interface Props {
  orbit: OrbitPreset;
  path: OrbitPath;
}

export function OrbitPlayer({ orbit, path }: Props) {
  const [run, setRun] = useState(0);
  const [hasCollided, setHasCollided] = useState(false);
  const [playChoice, setPlayChoice] = useState<boolean | null>(null);

  const isHydrated = useHydrated();
  const { detailPreferences, changeDetailPreferences } = useGallerySession();
  const shouldReduceMotion = usePrefersReducedMotion();

  const isPlaying = playChoice ?? !shouldReduceMotion;

  const handleCollision = useCallback(() => setHasCollided(true), []);

  const handleRestart = () => {
    setHasCollided(false);
    setRun((previous) => previous + 1);
  };

  return (
    <div className="grid w-full justify-items-start gap-4">
      <OrbitCanvas
        key={run}
        orbit={orbit}
        path={path}
        label={es.detail.player.canvasLabel(es.orbits[orbit.slug].name)}
        playing={isPlaying}
        preferences={detailPreferences}
        onCollision={handleCollision}
      />
      <p aria-live="polite" className="text-strong empty:hidden">
        {hasCollided ? es.detail.player.collision : ""}
      </p>
      <PlayerControls
        playing={isPlaying}
        collided={hasCollided}
        hydrated={isHydrated}
        preferences={detailPreferences}
        onPlayingChange={setPlayChoice}
        onRestart={handleRestart}
        onPreferencesChange={changeDetailPreferences}
      />
    </div>
  );
}
