import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { es } from "@/content/es";
import { orbits } from "@/orbits";
import { FilteredGallery, GalleryView } from "./filtered-gallery";
import { OrbitCard } from "./orbit-card";

export const metadata: Metadata = {
  title: es.gallery.metaTitle,
  description: es.gallery.description,
};

export default function GalleryPage() {
  const header = <PageHeader title={es.gallery.title} lead={es.gallery.lead} />;
  const cards = orbits.map((orbit) => ({
    slug: orbit.slug,
    holdsWithoutCorrection: orbit.holdsWithoutCorrection,
    card: <OrbitCard orbit={orbit} />,
  }));

  return (
    <Container className="pb-16">
      {/* Spec 03, Decision 8: until the URL is read, every orbit is shown. */}
      <Suspense
        fallback={<GalleryView header={header} cards={cards} filter="all" />}
      >
        <FilteredGallery header={header} cards={cards} />
      </Suspense>
    </Container>
  );
}
