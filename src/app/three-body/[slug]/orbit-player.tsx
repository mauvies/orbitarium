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
  const [collided, setCollided] = useState(false);
  const [playChoice, setPlayChoice] = useState<boolean | null>(null);

  const hydrated = useHydrated();
  const { detailPreferences, changeDetailPreferences } = useGallerySession();
  const prefersReducedMotion = usePrefersReducedMotion();

  const handleCollision = useCallback(() => setCollided(true), []);

  const playing = playChoice ?? !prefersReducedMotion;

  return (
    <div className="grid w-full justify-items-start gap-4">
      <OrbitCanvas
        key={run}
        orbit={orbit}
        path={path}
        label={es.detail.player.canvasLabel(es.orbits[orbit.slug].name)}
        playing={playing}
        preferences={detailPreferences}
        onCollision={handleCollision}
      />
      <p aria-live="polite" className="text-strong empty:hidden">
        {collided ? es.detail.player.collision : ""}
      </p>
      <PlayerControls
        playing={playing}
        collided={collided}
        hydrated={hydrated}
        preferences={detailPreferences}
        onPlayingChange={setPlayChoice}
        onRestart={() => {
          setCollided(false);
          setRun((previous) => previous + 1);
        }}
        onPreferencesChange={changeDetailPreferences}
      />
    </div>
  );
}
