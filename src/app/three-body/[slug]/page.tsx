import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/container";
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
      <p className="pt-6">
        <BackLink slug={orbit.slug} />
      </p>
      <div className="mt-4 flex max-w-180 items-center justify-between gap-4">
        <h1 className="min-w-0 font-heading font-semibold text-strong text-title">
          {content.name}
        </h1>
        <ShareButton />
      </div>
      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,45rem)_minmax(0,1fr)]">
        <OrbitPlayer
          orbit={orbit}
          path={orbitPath(orbit, CANVAS_MAX_WIDTH_PX)}
        />
        <div className="max-w-[60ch]">
          <p>{content.description}</p>
          <div className="mt-6">
            <OrbitFacts orbit={orbit} />
          </div>
        </div>
      </div>
    </Container>
  );
}

function orbitFor(slug: string): OrbitPreset {
  return getOrbit(slug) ?? notFound();
}
