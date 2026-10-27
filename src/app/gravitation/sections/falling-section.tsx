import { es } from "@/content/es";
import { FallingPicture } from "./falling-picture";
import { LessonSection } from "./lesson-section";
import { SectionIntro } from "./section-intro";
import { SectionQuestions } from "./section-questions";

const { title, intro } = es.gravitation.sections.falling;

export function FallingSection() {
  return (
    <LessonSection
      id="falling"
      title={title}
      intro={<SectionIntro>{intro}</SectionIntro>}
      picture={<FallingPicture />}
      questions={<SectionQuestions section="falling" />}
      textFirst
    />
  );
}
