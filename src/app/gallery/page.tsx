import type { Metadata } from "next";
import { es } from "@/content/es";
import { OrbitCard } from "@/gallery/orbit-card";
import { OrbitGrid } from "@/gallery/orbit-grid";
import { orbits } from "@/orbits";

export const metadata: Metadata = {
  title: es.gallery.metaTitle,
  description: es.gallery.description,
};

export default function GalleryPage() {
  const cards = orbits.map((orbit) => ({
    slug: orbit.slug,
    card: <OrbitCard orbit={orbit} />,
  }));
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:py-24">
      <h1 className="font-heading text-4xl font-semibold text-strong">
        {es.gallery.title}
      </h1>
      <p className="mt-4 max-w-2xl text-lg">{es.gallery.description}</p>
      <div className="mt-10">
        <OrbitGrid cards={cards} />
      </div>
    </div>
  );
}
