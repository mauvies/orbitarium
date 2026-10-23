import { es } from "@/content/es";

/**
 * Spec 03, Decision 9: what the simulation shows, not a formal result. Both
 * labels are full-strength text; only the dot differs (filled or hollow).
 */
export function StabilityStatus({ holds }: { holds: boolean }) {
  return (
    <p className="flex items-center gap-2 text-small">
      <span
        aria-hidden="true"
        className={`size-1.5 shrink-0 rounded-full ${
          holds ? "bg-accent" : "border border-muted"
        }`}
      />
      {holds ? es.gallery.stability.holds : es.gallery.stability.drifts}
    </p>
  );
}
