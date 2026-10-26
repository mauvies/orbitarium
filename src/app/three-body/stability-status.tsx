import { es } from "@/content/es";

/** Filled for an orbit that holds, hollow for one that drifts. */
export function StatusDot({ holds }: { holds: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`size-1.5 shrink-0 rounded-full ${
        holds ? "bg-accent" : "border border-muted"
      }`}
    />
  );
}

/**
 * Spec 03, Decision 9: what the simulation shows, not a formal result. Both
 * labels are full-strength text; only the dot differs.
 */
export function StabilityStatus({ holds }: { holds: boolean }) {
  return (
    <p className="flex items-center gap-2 text-small">
      <StatusDot holds={holds} />
      {holds ? es.threeBody.stability.holds : es.threeBody.stability.drifts}
    </p>
  );
}
