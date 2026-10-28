import { Container } from "@/components/container";
import { OrbitThumbnail } from "@/components/orbit-thumbnail";
import { PageHeader } from "@/components/page-header";
import { es } from "@/content/es";
import { getOrbit } from "@/orbits";
import { CannonThumbnail } from "./cannon-thumbnail";
import { HeroOrbit } from "./hero-orbit";
import { SectionCard } from "./section-card";

// A plate beside the text from 640 px, so both cards stay short.
const PLATE_CLASSES = "sm:w-56 sm:shrink-0";

export default function HomePage() {
  const galleryOrbit = getOrbit("moth-i");

  if (galleryOrbit === undefined) {
    throw new RangeError('no orbit with slug "moth-i"');
  }

  return (
    <Container className="pb-16">
      <div className="grid items-center gap-8 lg:grid-cols-2">
        <PageHeader display title={es.home.title} lead={es.home.lead} />
        <div className="hidden pt-10 lg:block">
          <HeroOrbit />
        </div>
      </div>
      <ul className="mt-16 grid gap-4 sm:gap-6 lg:grid-cols-2">
        <li>
          <SectionCard
            href="/gravitation"
            title={es.home.gravitation.link}
            description={es.home.gravitation.description}
            picture={<CannonThumbnail className={PLATE_CLASSES} />}
          />
        </li>
        <li>
          <SectionCard
            href="/three-body"
            title={es.home.threeBody.link}
            description={es.home.threeBody.description}
            picture={
              <OrbitThumbnail
                orbit={galleryOrbit}
                shape="beside-text"
                className={PLATE_CLASSES}
              />
            }
          />
        </li>
      </ul>
    </Container>
  );
}
