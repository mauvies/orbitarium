import { questionsFor } from "../questions";
import type { SectionId } from "../section-ids";
import { CheckQuestion } from "./check-question";

/** The part's question. */
export function SectionQuestions({ section }: { section: SectionId }) {
  return questionsFor(section).map((question) => (
    <CheckQuestion key={question.id} question={question} />
  ));
}
