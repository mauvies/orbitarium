import type { ReactNode } from "react";
import type { OrbitSlug } from "@/orbits";

export type GalleryCard = {
  readonly slug: OrbitSlug;
  /** Rendered on the server, where the thumbnail's path is traced. */
  readonly card: ReactNode;
};

export function OrbitGrid({ cards }: { cards: readonly GalleryCard[] }) {
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map(({ slug, card }) => (
        <li key={slug}>{card}</li>
      ))}
    </ul>
  );
}
