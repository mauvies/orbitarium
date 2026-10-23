import { es } from "@/content/es";

/** Spec 03, Decision 9: what the simulation shows, not a formal result. */
export function StabilityLabel({ holds }: { holds: boolean }) {
  return (
    <p
      className={`mt-2 self-start rounded-full px-3 py-1 text-sm ${
        holds ? "bg-accent/15 text-accent" : "bg-muted/15 text-body"
      }`}
    >
      {holds ? es.gallery.stability.holds : es.gallery.stability.drifts}
    </p>
  );
}
