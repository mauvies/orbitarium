"use client";

import { useState } from "react";
import { type FieldLimits, kmPerSecondToKmPerHour } from "@/cannon";
import { es } from "@/content/es";
import { useLessonControls, useLessonSession } from "../lesson-provider";
import { useHydrated } from "../use-hydrated";

const { cannon } = es.gravitation;

// The field shows every applied speed exactly: its resolution is 0.01 km/s.
const SPEED_DECIMALS = 2;

/**
 * The cannon's controls. They change the cannon only through the lesson's
 * controller, as the tutor will (spec 04, Decision 12): moving a control
 * sets, the button launches. Native inputs, so the arrow keys step the speed
 * by 0.01 km/s and the angle by 1° (Decision 8). Disabled until the page
 * hydrates: a click before then would be lost.
 */
export function CannonPanel() {
  const { set, launch, limits } = useLessonControls().cannon;
  const { speedKmPerSecond, angleDegrees } = useLessonSession().cannon;
  const hydrated = useHydrated();
  const speed = limits.speedKmPerSecond;
  const angle = limits.angleDegrees;

  return (
    <fieldset
      disabled={!hydrated}
      className="grid gap-5 rounded-xl border border-line p-4"
    >
      <legend className="sr-only">{cannon.controlsLabel}</legend>
      <div className="grid gap-2">
        <label htmlFor="cannon-speed" className="text-muted text-small">
          {cannon.speed}
        </label>
        <input
          id="cannon-speed"
          type="range"
          min={speed.min}
          max={speed.max}
          step={speed.resolution}
          value={speedKmPerSecond}
          aria-valuetext={cannon.speedValue(
            speedKmPerSecond,
            kmPerSecondToKmPerHour(speedKmPerSecond),
          )}
          onChange={(event) =>
            set({ speedKmPerSecond: event.target.valueAsNumber })
          }
          className="h-6 w-full accent-accent"
        />
        <SpeedField
          limits={speed}
          speedKmPerSecond={speedKmPerSecond}
          onSpeedChange={(value) => set({ speedKmPerSecond: value })}
        />
      </div>
      <div className="grid gap-2">
        <div className="flex items-baseline justify-between">
          <label htmlFor="cannon-angle" className="text-muted text-small">
            {cannon.angle}
          </label>
          <span className="text-strong tabular-nums">
            {cannon.angleValue(angleDegrees)}
          </span>
        </div>
        <input
          id="cannon-angle"
          type="range"
          min={angle.min}
          max={angle.max}
          step={angle.resolution}
          value={angleDegrees}
          aria-valuetext={cannon.angleValue(angleDegrees)}
          onChange={(event) =>
            set({ angleDegrees: event.target.valueAsNumber })
          }
          className="h-6 w-full accent-accent"
        />
      </div>
      <button
        type="button"
        onClick={() => launch()}
        className="rounded-[10px] bg-accent px-4 py-2 font-semibold text-bg-bottom disabled:opacity-50"
      >
        {cannon.launch}
      </button>
    </fieldset>
  );
}

/**
 * The speed as a number, for typing a value or fine steps (spec 04,
 * Decision 8). While the learner types, the field keeps their text, so «7.»
 * is not rewritten as «7»; every complete number is applied at once. On
 * leaving the field, or on Enter, it shows the value actually applied,
 * rounded and clamped by the controller.
 */
function SpeedField({
  limits,
  speedKmPerSecond,
  onSpeedChange,
}: {
  limits: FieldLimits;
  speedKmPerSecond: number;
  onSpeedChange: (speedKmPerSecond: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        inputMode="decimal"
        min={limits.min}
        max={limits.max}
        step={limits.resolution}
        aria-label={cannon.speedField}
        value={draft ?? speedKmPerSecond.toFixed(SPEED_DECIMALS)}
        onChange={(event) => {
          setDraft(event.target.value);
          if (Number.isFinite(event.target.valueAsNumber)) {
            onSpeedChange(event.target.valueAsNumber);
          }
        }}
        onBlur={() => setDraft(null)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            setDraft(null);
          }
        }}
        className="w-28 rounded-[10px] border border-line bg-surface px-3 py-2 text-strong tabular-nums"
      />
      <span className="text-muted text-small">{cannon.speedUnit}</span>
    </div>
  );
}
