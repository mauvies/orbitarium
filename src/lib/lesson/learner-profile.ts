import {
  type Answers,
  type Concept,
  type Grade,
  grade,
  QUESTIONS,
  type QuestionId,
} from "./questions";

/** A skipped question is "unknown", not wrong (docs/design/part-a-learning-experience.md). */
export type QuestionResult = { readonly status: "unknown" } | Grade;

export type ProfileEntry = {
  readonly question: QuestionId;
  readonly concept: Concept;
  readonly result: QuestionResult;
};

/** One entry per question, in the lesson's order (spec 04, Decision 6). */
export type LearnerProfile = readonly ProfileEntry[];

export function learnerProfile(answers: Answers): LearnerProfile {
  return QUESTIONS.map(({ id, concept }) => {
    const answer = answers[id];

    return {
      question: id,
      concept,
      result: answer === undefined ? { status: "unknown" } : grade(id, answer),
    };
  });
}
