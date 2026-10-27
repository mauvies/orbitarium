"use client";

import { useState } from "react";
import { es } from "@/content/es";
import { useHydrated } from "../use-hydrated";
import { MOON_DISTANCE_RADII, pullFraction } from "./inverse-square";

const { distance } = es.gravitation;

/**
 * Step 3's exploration: the pull relative to the surface, from the surface to
 * the Moon's distance, in whole Earth radii from the centre (spec 04,
 * Decision 4, L14).
 */
export function DistanceSlider() {
  const [radii, setRadii] = useState(1);
  const hydrated = useHydrated();
  const valueText = distance.valueText(radii, pullFraction(radii).denominator);
  return (
    <div className="mt-8 max-w-[60ch]">
      <label htmlFor="distance" className="block text-strong">
        {distance.label}
      </label>
      <input
        id="distance"
        type="range"
        min={1}
        max={MOON_DISTANCE_RADII}
        step={1}
        value={radii}
        onChange={(event) => setRadii(event.currentTarget.valueAsNumber)}
        disabled={!hydrated}
        aria-valuetext={valueText}
        className="mt-2 w-full accent-accent"
      />
      <output htmlFor="distance" className="mt-2 block">
        {valueText}
      </output>
    </div>
  );
}
