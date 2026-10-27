import { es } from "@/content/es";
import { LessonSection } from "./lesson-section";
import { MoonPicture } from "./moon-picture";
import { SectionIntro } from "./section-intro";
import { SectionQuestions } from "./section-questions";

const { title, intro } = es.gravitation.sections.moon;

export function MoonSection() {
  return (
    <LessonSection
      id="moon"
      title={title}
      intro={<SectionIntro>{intro}</SectionIntro>}
      picture={<MoonPicture />}
      questions={<SectionQuestions section="moon" />}
      textFirst
    />
  );
}
