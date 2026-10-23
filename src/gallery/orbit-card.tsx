import Link from "next/link";
import { es } from "@/content/es";
import type { OrbitPreset } from "@/orbits";
import { OrbitThumbnail } from "./orbit-thumbnail";
import { StabilityLabel } from "./stability-label";

export function OrbitCard({ orbit }: { orbit: OrbitPreset }) {
  return (
    <article className="relative flex h-full flex-col rounded-2xl bg-surface p-4 ring-1 ring-muted/30 focus-within:ring-accent hover:ring-accent motion-safe:transition-shadow">
      <OrbitThumbnail orbit={orbit} />
      <h2 className="mt-4 font-heading text-xl font-medium text-strong">
        {/* The link covers the whole card, but its name is only the orbit's. */}
        <Link
          href={`/gallery/${orbit.slug}`}
          className="after:absolute after:inset-0 after:rounded-2xl"
        >
          {es.orbits[orbit.slug].name}
        </Link>
      </h2>
      <StabilityLabel holds={orbit.holdsWithoutCorrection} />
    </article>
  );
}
