import { es } from "@/content/es";
import { LawPicture } from "./law-picture";
import { LessonSection } from "./lesson-section";
import { SectionIntro } from "./section-intro";
import { SectionQuestions } from "./section-questions";

const { title, intro } = es.gravitation.sections.law;
const { law } = es.gravitation;

export function LawSection() {
  return (
    <LessonSection
      id="law"
      title={title}
      intro={
        <>
          <SectionIntro>{intro}</SectionIntro>
          <p className="mt-3 max-w-[60ch]">{law.constant}</p>
        </>
      }
      picture={<LawPicture />}
      questions={<SectionQuestions section="law" />}
      textFirst
    />
  );
}
