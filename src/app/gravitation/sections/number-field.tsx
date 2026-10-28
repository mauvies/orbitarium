"use client";

import { type ChangeEvent, type KeyboardEvent, useState } from "react";
import type { FieldLimits } from "@/cannon";

interface Props {
  id: string;
  label: string;
  limits: FieldLimits;
  decimals: number;
  value: number;
  onChange: (value: number) => void;
}

/**
 * A setting as a number (spec 04, Decision 8). While the learner types, the
 * field keeps their text, so «7.» is not rewritten as «7»; every complete
 * number is applied at once. On leaving the field, or on Enter, it shows the
 * value actually applied, rounded and clamped by the controller.
 */
export function NumberField({
  id,
  label,
  limits,
  decimals,
  value,
  onChange,
}: Props) {
  const [draft, setDraft] = useState<string | null>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDraft(event.target.value);

    if (Number.isFinite(event.target.valueAsNumber)) {
      onChange(event.target.valueAsNumber);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      setDraft(null);
    }
  };

  return (
    <input
      id={id}
      name={id}
      type="number"
      inputMode="decimal"
      min={limits.min}
      max={limits.max}
      step={limits.resolution}
      aria-label={label}
      value={draft ?? value.toFixed(decimals)}
      onChange={handleChange}
      onBlur={() => setDraft(null)}
      onKeyDown={handleKeyDown}
      className="w-18 rounded-[10px] border border-muted bg-surface p-1 text-strong tabular-nums"
    />
  );
}
