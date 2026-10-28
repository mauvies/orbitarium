import { questionsFor } from "@/lib/lesson/questions";
import type { SectionId } from "@/lib/lesson/section-ids";
import { CheckQuestion } from "./check-question";

interface Props {
  section: SectionId;
}

export function SectionQuestions({ section }: Props) {
  return questionsFor(section).map((question) => (
    <CheckQuestion key={question.id} question={question} />
  ));
}
