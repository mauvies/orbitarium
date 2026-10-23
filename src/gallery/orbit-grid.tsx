import type { ReactNode } from "react";
import type { OrbitSlug } from "@/orbits";

export type GalleryCard = {
  readonly slug: OrbitSlug;
  readonly holdsWithoutCorrection: boolean;
  /** Rendered on the server, where the thumbnail's path is traced. */
  readonly card: ReactNode;
};

export function OrbitGrid({ cards }: { cards: readonly GalleryCard[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
      {cards.map(({ slug, card }) => (
        <li key={slug}>{card}</li>
      ))}
    </ul>
  );
}
