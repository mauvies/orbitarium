import type { CannonField, FieldLimits } from "@/cannon";
import { NumberField } from "./number-field";

// The fields show every applied value exactly: 0.01 km/s, 1° and 10 km.
const DECIMALS: Readonly<Record<CannonField, number>> = {
  speedKmPerSecond: 2,
  angleDegrees: 0,
  altitudeKm: 0,
};

/**
 * One setting in one row: a slider for coarse changes, then a number field
 * for typing or fine steps, and its unit (spec 04, Decision 8). Native
 * inputs, so the arrow keys step by the setting's resolution in both.
 */
export function SettingRow({
  field,
  label,
  fieldLabel,
  unit,
  limits,
  value,
  valueText,
  onChange,
}: {
  field: CannonField;
  label: string;
  fieldLabel: string;
  unit: string;
  limits: FieldLimits;
  value: number;
  valueText: string;
  onChange: (value: number) => void;
}) {
  const sliderId = `cannon-${field}`;
  return (
    <div className="grid gap-1">
      <label htmlFor={sliderId} className="text-muted text-small">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={sliderId}
          name={sliderId}
          type="range"
          min={limits.min}
          max={limits.max}
          step={limits.resolution}
          value={value}
          aria-valuetext={valueText}
          onChange={(event) => onChange(event.target.valueAsNumber)}
          className="h-6 min-w-0 flex-1 accent-accent"
        />
        <NumberField
          id={`${sliderId}-field`}
          label={fieldLabel}
          limits={limits}
          decimals={DECIMALS[field]}
          value={value}
          onChange={onChange}
        />
        <span data-unit className="w-8 text-muted text-small">
          {unit}
        </span>
      </div>
    </div>
  );
}
