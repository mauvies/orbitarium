"use client";

import { useLayoutEffect, useRef } from "react";
import type { OrbitPath } from "@/drawing/orbit-path";
import type { OrbitPreset } from "@/orbits";
import {
  type OrbitAnimation,
  type PlayerControls,
  startOrbitAnimation,
} from "./orbit-animation";
import type { PlaybackSpeed } from "./speed";
import { canvasAspectRatio } from "./transform";

/**
 * The canvas and the animation on it. React renders it only when a control
 * changes; the frames never go through React (spec 03, Decision 5).
 */
export function OrbitCanvas({
  orbit,
  path,
  label,
  playing,
  speed,
  correction,
}: {
  orbit: OrbitPreset;
  path: OrbitPath;
  label: string;
  playing: boolean;
  speed: PlaybackSpeed;
  correction: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<OrbitAnimation | null>(null);
  const controlsRef = useRef<PlayerControls>({ playing, speed, correction });

  // Layout effects, so the controls are in place before the first paint.
  // This one comes first, so an animation started below gets the latest.
  useLayoutEffect(() => {
    controlsRef.current = { playing, speed, correction };
    animationRef.current?.setControls(controlsRef.current);
  }, [playing, speed, correction]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) {
      throw new Error("the orbit canvas is not mounted");
    }
    const animation = startOrbitAnimation(
      canvas,
      orbit,
      path,
      controlsRef.current,
    );
    animationRef.current = animation;
    return () => {
      animation.stop();
      animationRef.current = null;
    };
  }, [orbit, path]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={label}
      className="w-full max-w-160 rounded-xl bg-bg-bottom"
      // Each orbit's own ratio, so Tailwind cannot generate the class.
      style={{ aspectRatio: canvasAspectRatio(path.bounds) }}
    />
  );
}
