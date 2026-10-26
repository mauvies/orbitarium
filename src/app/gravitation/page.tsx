import type { Metadata } from "next";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { es } from "@/content/es";
import { CannonPart } from "./_sections/cannon-step";
import { FallingPicture, FallingText } from "./_sections/falling-step";
import { LawPicture, LawText } from "./_sections/law-step";
import { MoonPicture, MoonText } from "./_sections/moon-step";
import { MutualPicture, MutualText } from "./_sections/mutual-step";
import { LessonSection } from "./_sections/step-layout";

const { title, lead, steps } = es.gravitation;

export const metadata: Metadata = { title };

// Prototype of spec 04's one-page lesson: four sections, the third in two parts.
export default function GravitationPage() {
  return (
    <Container className="pb-16">
      <PageHeader title={title} lead={lead} />
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
        <div>
          <LessonSection
            id="moon"
            title={steps.moon.title}
            picture={<MoonPicture />}
            textFirst
          >
            <MoonText />
          </LessonSection>
          <CannonPart />
        </div>
        <LessonSection
          id="law"
          title={steps.law.title}
          picture={<LawPicture />}
        >
          <LawText />
        </LessonSection>
      </div>
    </Container>
  );
}
