import { es } from "@/content/es";
import { LessonSection } from "./lesson-section";
import { OrbitPicture } from "./orbit-picture";
import { SectionIntro } from "./section-intro";
import { SectionQuestions } from "./section-questions";

const { title, intro } = es.gravitation.sections.orbit;

export function OrbitSection() {
  return (
    <LessonSection
      id="orbit"
      title={title}
      intro={<SectionIntro>{intro}</SectionIntro>}
      picture={<OrbitPicture />}
      questions={<SectionQuestions section="orbit" />}
    />
  );
}
