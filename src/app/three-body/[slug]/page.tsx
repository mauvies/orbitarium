import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { es } from "@/content/es";
import { orbitPath } from "@/drawing/orbit-path";
import { getOrbit, type OrbitPreset, orbits } from "@/orbits";
import { BackLink } from "./back-link";
import { CANVAS_MAX_WIDTH_PX } from "./orbit-animation";
import { OrbitFacts } from "./orbit-facts";
import { OrbitPlayer } from "./orbit-player";
import { ShareButton } from "./share-button";

export const dynamicParams = false;

export function generateStaticParams(): { slug: string }[] {
  return orbits.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/three-body/[slug]">): Promise<Metadata> {
  const { name, description } = es.orbits[orbitFor((await params).slug).slug];
  return { title: name, description };
}

export default async function OrbitPage({
  params,
}: PageProps<"/three-body/[slug]">) {
  const orbit = orbitFor((await params).slug);
  const content = es.orbits[orbit.slug];

  return (
    <Container className="pb-16">
      <PageHeader title={content.name} />
      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,45rem)_minmax(0,1fr)]">
        <OrbitPlayer
          orbit={orbit}
          path={orbitPath(orbit, CANVAS_MAX_WIDTH_PX)}
        />
        <div className="max-w-[60ch]">
          <OrbitFacts orbit={orbit} />
          <div className="mt-4">
            <ShareButton />
          </div>
          <p className="mt-8">
            <BackLink />
          </p>
        </div>
      </div>
    </Container>
  );
}

function orbitFor(slug: string): OrbitPreset {
  return getOrbit(slug) ?? notFound();
}
