"use client";

import { useLayoutEffect, useRef } from "react";
import type { OrbitPath } from "@/drawing/orbit-path";
import type { OrbitPreset } from "@/orbits";
import type { DetailPreferences } from "./detail-preferences";
import {
  type OrbitAnimation,
  type PlayerControls,
  startOrbitAnimation,
} from "./orbit-animation";

interface Props {
  orbit: OrbitPreset;
  path: OrbitPath;
  label: string;
  playing: boolean;
  preferences: DetailPreferences;
  onCollision: () => void;
}

export function OrbitCanvas({
  orbit,
  path,
  label,
  playing,
  preferences: { speed, showPath, showTrail, correction },
  onCollision,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<OrbitAnimation | null>(null);

  const controlsRef = useRef<PlayerControls>({
    playing,
    speed,
    showPath,
    showTrail,
    correction,
  });

  // Layout effects, so the controls are in place before the first paint.
  // This one comes first, so an animation started below gets the latest.
  useLayoutEffect(() => {
    controlsRef.current = { playing, speed, showPath, showTrail, correction };
    animationRef.current?.setControls(controlsRef.current);
  }, [playing, speed, showPath, showTrail, correction]);

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
      onCollision,
    );

    animationRef.current = animation;

    return () => {
      animation.stop();
      animationRef.current = null;
    };
  }, [orbit, path, onCollision]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={label}
      className="aspect-3/2 w-full max-w-180 rounded-xl bg-bg-bottom"
    />
  );
}
