"use client";

import {
  CANNON_PRESET_IDS,
  CANNON_PRESETS,
  kmPerSecondToKmPerHour,
} from "@/cannon";
import { es } from "@/content/es";
import {
  useClearEarlierPaths,
  useLessonControls,
  useLessonSession,
} from "../lesson-provider";
import { useHydrated } from "../use-hydrated";
import { SettingRow } from "./setting-row";

const { cannon } = es.gravitation;

const PRESET_BUTTON =
  "rounded-[10px] border border-muted bg-surface px-3 py-2 text-small text-strong last:col-span-2 hover:bg-surface-raised";

/**
 * The cannon's controls, in the order of spec 04, Decision 8: the launch
 * button and clearing the paths, the speed, the angle, the height and the
 * presets. They change the cannon only through the lesson's controller, as the
 * tutor will (Decision 12): moving a control sets, the launch button and the
 * presets launch. Disabled until the page hydrates: a click before then
 * would be lost.
 */
export function CannonPanel() {
  const { set, launch, limits } = useLessonControls().cannon;
  const session = useLessonSession();
  const { speedKmPerSecond, angleDegrees, altitudeKm } = session.cannon;
  const clearEarlierPaths = useClearEarlierPaths();
  const hydrated = useHydrated();

  return (
    <fieldset disabled={!hydrated} className="grid gap-3 sm:gap-5">
      <legend className="sr-only">{cannon.controlsLabel}</legend>
      <div className="grid gap-2">
        <button
          type="button"
          onClick={() => launch()}
          className="rounded-[10px] bg-accent px-4 py-1.5 font-semibold text-bg-bottom disabled:opacity-50"
        >
          {cannon.launch}
        </button>
        {/* Outlined: it removes paths instead of firing (spec 04, Decision 8). */}
        <button
          type="button"
          onClick={clearEarlierPaths}
          disabled={session.launches.length <= 1}
          className="rounded-[10px] border border-muted px-4 py-1.5 font-semibold text-strong hover:bg-surface-raised disabled:opacity-50 disabled:hover:bg-transparent"
        >
          {cannon.clearPaths}
        </button>
      </div>
      <SettingRow
        field="speedKmPerSecond"
        label={cannon.speed}
        fieldLabel={cannon.speedField}
        unit={cannon.speedUnit}
        limits={limits.speedKmPerSecond}
        value={speedKmPerSecond}
        valueText={cannon.speedValue(
          speedKmPerSecond,
          kmPerSecondToKmPerHour(speedKmPerSecond),
        )}
        onChange={(value) => set({ speedKmPerSecond: value })}
      />
      <SettingRow
        field="angleDegrees"
        label={cannon.angle}
        fieldLabel={cannon.angleField}
        unit={cannon.angleUnit}
        limits={limits.angleDegrees}
        value={angleDegrees}
        valueText={cannon.angleValue(angleDegrees)}
        onChange={(value) => set({ angleDegrees: value })}
      />
      <SettingRow
        field="altitudeKm"
        label={cannon.altitude}
        fieldLabel={cannon.altitudeField}
        unit={cannon.altitudeUnit}
        limits={limits.altitudeKm}
        value={altitudeKm}
        valueText={cannon.altitudeValue(altitudeKm)}
        onChange={(value) => set({ altitudeKm: value })}
      />
      <fieldset className="grid gap-2">
        <legend className="mb-2 text-muted text-small">{cannon.presets}</legend>
        <div className="grid grid-cols-2 gap-2">
          {CANNON_PRESET_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => launch(CANNON_PRESETS[id])}
              className={PRESET_BUTTON}
            >
              {cannon.presetLabels[id]}
            </button>
          ))}
        </div>
      </fieldset>
    </fieldset>
  );
}
