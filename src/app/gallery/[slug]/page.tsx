import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { es } from "@/content/es";
import { BackToGalleryLink } from "@/gallery/back-to-gallery-link";
import { OrbitFacts } from "@/gallery/orbit-facts";
import { OrbitThumbnail } from "@/gallery/orbit-thumbnail";
import { getOrbit, type OrbitPreset, orbits } from "@/orbits";

// Spec 03, Decision 1: one page per orbit, built ahead of time; any other
// slug is a 404.
export const dynamicParams = false;

export function generateStaticParams(): { slug: string }[] {
  return orbits.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/gallery/[slug]">): Promise<Metadata> {
  const { name, description } = es.orbits[orbitFor((await params).slug).slug];
  return { title: name, description };
}

export default async function OrbitPage({
  params,
}: PageProps<"/gallery/[slug]">) {
  const orbit = orbitFor((await params).slug);
  const content = es.orbits[orbit.slug];
  return (
    <Container className="pb-16">
      <PageHeader title={content.name} />
      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* The orbit's path until the animation replaces it (spec 03, step 12). */}
        <OrbitThumbnail orbit={orbit} />
        <div className="max-w-[60ch]">
          <p>{content.description}</p>
          <div className="mt-6">
            <OrbitFacts orbit={orbit} />
          </div>
          <p className="mt-8">
            <BackToGalleryLink />
          </p>
        </div>
      </div>
    </Container>
  );
}

function orbitFor(slug: string): OrbitPreset {
  return getOrbit(slug) ?? notFound();
}
