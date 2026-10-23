import type { Metadata } from "next";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
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
    <Container className="pb-16">
      <PageHeader title={es.gallery.title} lead={es.gallery.lead} />
      <div className="mt-8">
        <OrbitGrid cards={cards} />
      </div>
    </Container>
  );
}
