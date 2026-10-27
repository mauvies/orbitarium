import { es } from "@/content/es";
import { LessonSection } from "./lesson-section";
import { MutualPicture } from "./mutual-picture";
import { SectionIntro } from "./section-intro";
import { SectionQuestions } from "./section-questions";

const { title, intro } = es.gravitation.sections.mutual;

export function MutualSection() {
  return (
    <LessonSection
      id="mutual"
      title={title}
      intro={<SectionIntro>{intro}</SectionIntro>}
      picture={<MutualPicture />}
      questions={<SectionQuestions section="mutual" />}
    />
  );
}
