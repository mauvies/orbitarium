import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { es } from "@/content/es";
import { CannonBand } from "./_sections/cannon-band";
import { FallingPicture, FallingText } from "./_sections/falling-step";
import { LawPicture, LawText } from "./_sections/law-step";
import { MoonPicture, MoonText } from "./_sections/moon-step";
import { MutualPicture, MutualText } from "./_sections/mutual-step";
import { OrbitPicture, OrbitText } from "./_sections/orbit-step";
import { LessonSection } from "./_sections/step-layout";

const { title, lead, steps } = es.gravitation;

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
        <LessonSection
          id="falling"
          title={steps.falling.title}
          picture={<FallingPicture />}
          textFirst
        >
          <FallingText />
        </LessonSection>
        <LessonSection
          id="mutual"
          title={steps.mutual.title}
          picture={<MutualPicture />}
        >
          <MutualText />
        </LessonSection>
        <LessonSection
          id="moon"
          title={steps.moon.title}
          picture={<MoonPicture />}
          textFirst
        >
          <MoonText />
        </LessonSection>
        <LessonSection
          id="orbit"
          title={steps.orbit.title}
          picture={<OrbitPicture />}
        >
          <OrbitText />
        </LessonSection>
        <CannonBand />
        <LessonSection
          id="law"
          title={steps.law.title}
          picture={<LawPicture />}
          textFirst
        >
          <LawText />
        </LessonSection>
      </div>
    </Container>
  );
}
