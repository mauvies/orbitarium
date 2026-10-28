import { es } from "@/content/es";
import type { Launch } from "../lesson-session";
import { returnsFromBeyondView } from "../outcome-label";

const { cannon } = es.gravitation;

interface Props {
  launch: Launch | null;
}

/**
 * The outcome, once it can be seen: a label on the canvas, and a polite live
 * region that says it (spec 04, Decision 11). The region is always there, so
 * screen readers announce the change.
 */
export function CannonOutcomeLabel({ launch }: Props) {
  const outcome = launch === null ? null : cannon.outcomes[launch.outcome];
  const isFromAfar = launch !== null && returnsFromBeyondView(launch);

  return (
    <>
      <p
        data-testid="cannon-outcome"
        aria-hidden="true"
        className={`absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] rounded-[10px] border border-muted bg-surface px-3 py-1.5 font-semibold text-small text-strong ${outcome === null ? "invisible" : ""}`}
      >
        {outcome === null ? "" : cannon.outcomeLabel(outcome.label, isFromAfar)}
      </p>
      <output className="sr-only">
        {outcome === null
          ? ""
          : cannon.outcomeAnnouncement(outcome.announced, isFromAfar)}
      </output>
    </>
  );
}
