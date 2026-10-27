"use client";

import { useState } from "react";
import {
  CANNON_PRESETS,
  type CannonOutcome,
  type FieldLimits,
  kmPerSecondToKmPerHour,
  REFERENCE_SPEEDS,
} from "@/cannon";
import { es } from "@/content/es";
import {
  useClearEarlierPaths,
  useLessonControls,
  useLessonSession,
} from "../lesson-provider";
import { useHydrated } from "../use-hydrated";

const { cannon } = es.gravitation;

// The field shows every applied speed exactly: its resolution is 0.01 km/s.
const SPEED_DECIMALS = 2;

const PRESET_OUTCOMES = Object.keys(CANNON_PRESETS) as CannonOutcome[];
const SECONDARY_BUTTON =
  "rounded-[10px] border border-line bg-surface px-3 py-2 text-small text-strong hover:bg-surface-raised disabled:opacity-50 disabled:hover:bg-surface";

/**
 * The cannon's controls. They change the cannon only through the lesson's
 * controller, as the tutor will (spec 04, Decision 12): moving a control
 * sets, the launch button and the presets launch. Native inputs, so the
 * arrow keys step the speed by 0.01 km/s and the angle by 1° (Decision 8).
 * Disabled until the page hydrates: a click before then would be lost.
 */
export function CannonPanel() {
  const { set, launch, limits } = useLessonControls().cannon;
  const session = useLessonSession();
  const { speedKmPerSecond, angleDegrees } = session.cannon;
  const clearEarlierPaths = useClearEarlierPaths();
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
        <ReferenceSpeeds />
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
      <fieldset className="grid gap-2">
        <legend className="mb-2 text-muted text-small">{cannon.presets}</legend>
        <div className="grid grid-cols-2 gap-2">
          {PRESET_OUTCOMES.map((outcome) => (
            <button
              key={outcome}
              type="button"
              onClick={() => launch(CANNON_PRESETS[outcome])}
              className={SECONDARY_BUTTON}
            >
              {cannon.outcomes[outcome].label}
            </button>
          ))}
        </div>
      </fieldset>
      <button
        type="button"
        onClick={clearEarlierPaths}
        disabled={session.launches.length <= 1}
        className={SECONDARY_BUTTON}
      >
        {cannon.clearPaths}
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

/**
 * The two speeds to aim for, computed from the model at the launch point
 * (spec 04, Decision 11).
 */
function ReferenceSpeeds() {
  const { circularKmPerSecond, escapeKmPerSecond } = REFERENCE_SPEEDS;
  return (
    <ul className="grid gap-1 text-muted text-small">
      <li>
        {cannon.circularReference(
          circularKmPerSecond,
          kmPerSecondToKmPerHour(circularKmPerSecond),
        )}
      </li>
      <li>{cannon.escapeReference(escapeKmPerSecond)}</li>
    </ul>
  );
}
