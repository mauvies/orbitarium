import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/page-header";
import { es } from "@/content/es";
import { CannonBand } from "./sections/cannon-band";
import { FallingIntro, FallingPicture } from "./sections/falling-step";
import { LawIntro, LawPicture } from "./sections/law-step";
import { MoonIntro, MoonPicture } from "./sections/moon-step";
import { MutualIntro, MutualPicture } from "./sections/mutual-step";
import { OrbitIntro, OrbitPicture } from "./sections/orbit-step";
import { LessonSection, StepQuestions } from "./sections/step-layout";

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
          intro={<FallingIntro />}
          picture={<FallingPicture />}
          questions={<StepQuestions step="falling" />}
          textFirst
        />
        <LessonSection
          id="mutual"
          title={steps.mutual.title}
          intro={<MutualIntro />}
          picture={<MutualPicture />}
          questions={<StepQuestions step="mutual" />}
        />
        <LessonSection
          id="moon"
          title={steps.moon.title}
          intro={<MoonIntro />}
          picture={<MoonPicture />}
          questions={<StepQuestions step="moon" />}
          textFirst
        />
        <LessonSection
          id="orbit"
          title={steps.orbit.title}
          intro={<OrbitIntro />}
          picture={<OrbitPicture />}
          questions={<StepQuestions step="orbit" />}
        />
        <CannonBand />
        <LessonSection
          id="law"
          title={steps.law.title}
          intro={<LawIntro />}
          picture={<LawPicture />}
          questions={<StepQuestions step="law" />}
          textFirst
        />
      </div>
    </Container>
  );
}
