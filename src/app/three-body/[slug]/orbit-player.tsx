"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { usePrefersReducedMotion } from "@/components/use-prefers-reduced-motion";
import { es } from "@/content/es";
import type { OrbitPath } from "@/drawing/orbit-path";
import type { OrbitPreset } from "@/orbits";
import { useGallerySession } from "../gallery-session";
import { OrbitCanvas } from "./orbit-canvas";
import { PlayerControls } from "./player-controls";

/** The animated orbit, its controls and the collision message. */
export function OrbitPlayer({
  orbit,
  path,
}: {
  orbit: OrbitPreset;
  path: OrbitPath;
}) {
  const { detailPreferences, changeDetailPreferences } = useGallerySession();
  const prefersReducedMotion = usePrefersReducedMotion();
  const hydrated = useHydrated();
  const [playChoice, setPlayChoice] = useState<boolean | null>(null);
  const [collided, setCollided] = useState(false);
  // A new key mounts a fresh canvas: a new playback and an empty trail.
  const [run, setRun] = useState(0);
  const handleCollision = useCallback(() => setCollided(true), []);
  // Spec 03, Decision 11: reduced motion only decides how playback starts.
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

/** False while rendering on the server and hydrating, true after. */
function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
}

function subscribeToNothing(): () => void {
  return () => {};
}
