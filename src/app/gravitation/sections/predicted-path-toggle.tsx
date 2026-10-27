"use client";

import { es } from "@/content/es";
import { useLessonSession, useSetPredictedPathShown } from "../lesson-provider";

const { cannon } = es.gravitation;

/**
 * Shows the path the current settings would give, on at first (spec 04,
 * Decision 11).
 */
export function PredictedPathToggle() {
  const { showPredictedPath } = useLessonSession();
  const setPredictedPathShown = useSetPredictedPathShown();
  return (
    <label className="flex items-center gap-2 text-small">
      <input
        id="cannon-predicted-path"
        name="cannon-predicted-path"
        type="checkbox"
        checked={showPredictedPath}
        onChange={(event) => setPredictedPathShown(event.target.checked)}
        className="size-4 accent-accent"
      />
      {cannon.predictedPath}
    </label>
  );
}
