import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { es } from "@/content/es";
import { CannonBand } from "./sections/cannon-band";
import { FallingSection } from "./sections/falling-section";
import { LawSection } from "./sections/law-section";
import { MoonSection } from "./sections/moon-section";
import { MutualSection } from "./sections/mutual-section";
import { OrbitSection } from "./sections/orbit-section";

const { title, lead } = es.gravitation;

export const metadata: Metadata = { title };

// Spec 04, Decision 1: four sections of the reasoning, and Newton's cannon in
// a band of its own before the law.
export default function GravitationPage() {
  return (
    <Container className="pb-16">
      <PageHeader
        title={title}
        lead={
          <>
            {lead.before}
            <Link
              href="#cannon"
              className="text-accent underline underline-offset-4"
            >
              {lead.link}
            </Link>
            {lead.after}
          </>
        }
      />
      <div className="divide-y divide-line">
        <FallingSection />
        <MutualSection />
        <MoonSection />
        <OrbitSection />
        <CannonBand />
        <LawSection />
      </div>
    </Container>
  );
}
