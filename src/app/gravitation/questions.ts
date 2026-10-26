import { es } from "@/content/es";
import type { StepId } from "./steps";

export type Concept =
  | "fall-direction"
  | "mutual-attraction"
  | "inverse-square"
  | "orbit-as-falling"
  | "full-law";

/** What a wrong answer tells us the learner believes (spec 04, Decision 5). */
export type Misconception =
  | "absolute-down"
  | "no-common-cause"
  | "larger-body-pulls-harder"
  | "bigger-effect-means-bigger-force"
  | "one-way-attraction"
  | "linear-with-distance"
  | "distance-does-not-matter"
  | "farther-means-stronger"
  | "everything-falls-back"
  | "faster-means-orbit"
  | "no-gravity-in-space"
  | "outward-force-balances"
  | "gravity-does-not-reach"
  | "mass-squared"
  | "equal-fall-means-equal-force";

export type QuestionId =
  | "two-falls"
  | "who-pulls-harder"
  | "twice-as-far"
  | "launch-at-12"
  | "why-the-moon-does-not-fall"
  | "twice-the-mass";

export type QuestionOption = {
  readonly id: string;
  /** Null for the correct option. */
  readonly misconception: Misconception | null;
};

export type Question = {
  readonly id: QuestionId;
  readonly step: StepId;
  readonly concept: Concept;
  /**
   * When the feedback appears: at once, or once a 12 km/s launch has played,
   * for the prediction (spec 04, Decision 5: predict, observe, explain).
   */
  readonly feedback: "on-answer" | "after-escape-launch";
  readonly options: readonly QuestionOption[];
};

/** The first option chosen for each question answered. */
export type Answers = Readonly<Partial<Record<QuestionId, string>>>;

export type Grade =
  | { readonly status: "correct" }
  | { readonly status: "misconception"; readonly misconception: Misconception };

type OptionText = { readonly label: string; readonly feedback: string };

const QUESTION_TEXT: Readonly<
  Record<
    QuestionId,
    {
      readonly prompt: string;
      readonly options: Readonly<Record<string, OptionText>>;
    }
  >
> = es.gravitation.questions;

// Spec 04, Decision 5 and "Questions and misconceptions", in the lesson's order.
export const QUESTIONS: readonly Question[] = [
  {
    id: "two-falls",
    step: "falling",
    concept: "fall-direction",
    feedback: "on-answer",
    options: [
      { id: "centre", misconception: null },
      { id: "screen-bottom", misconception: "absolute-down" },
      { id: "south-pole", misconception: "absolute-down" },
      { id: "different-directions", misconception: "no-common-cause" },
    ],
  },
  {
    id: "who-pulls-harder",
    step: "mutual",
    concept: "mutual-attraction",
    feedback: "on-answer",
    options: [
      { id: "earth", misconception: "larger-body-pulls-harder" },
      { id: "apple", misconception: "bigger-effect-means-bigger-force" },
      { id: "only-earth", misconception: "one-way-attraction" },
      { id: "equal", misconception: null },
    ],
  },
  {
    id: "twice-as-far",
    step: "moon",
    concept: "inverse-square",
    feedback: "on-answer",
    options: [
      { id: "half", misconception: "linear-with-distance" },
      { id: "quarter", misconception: null },
      { id: "same", misconception: "distance-does-not-matter" },
      { id: "double", misconception: "farther-means-stronger" },
    ],
  },
  {
    id: "launch-at-12",
    step: "cannon",
    concept: "orbit-as-falling",
    feedback: "after-escape-launch",
    options: [
      { id: "falls-back", misconception: "everything-falls-back" },
      { id: "orbit", misconception: "faster-means-orbit" },
      { id: "escapes", misconception: null },
    ],
  },
  {
    id: "why-the-moon-does-not-fall",
    step: "cannon",
    concept: "orbit-as-falling",
    feedback: "on-answer",
    options: [
      { id: "no-gravity", misconception: "no-gravity-in-space" },
      { id: "falls-sideways", misconception: null },
      { id: "pushed", misconception: "outward-force-balances" },
      { id: "does-not-reach", misconception: "gravity-does-not-reach" },
    ],
  },
  {
    id: "twice-the-mass",
    step: "law",
    concept: "full-law",
    feedback: "on-answer",
    options: [
      { id: "double", misconception: null },
      { id: "quadruple", misconception: "mass-squared" },
      { id: "same", misconception: "equal-fall-means-equal-force" },
    ],
  },
];

export function questionsFor(step: StepId): readonly Question[] {
  return QUESTIONS.filter((question) => question.step === step);
}

/** A step counts as answered once all its questions are (spec 04, Decision 3). */
export function isStepAnswered(step: StepId, answers: Answers): boolean {
  return questionsFor(step).every(({ id }) => answers[id] !== undefined);
}

/** Graded by the app, because the correct option is known (spec 04, Decision 5). */
export function grade(questionId: QuestionId, optionId: string): Grade {
  const option = questionFor(questionId).options.find(
    ({ id }) => id === optionId,
  );
  if (option === undefined) {
    throw new RangeError(
      `option must be one of ${questionId}'s options, got "${optionId}"`,
    );
  }
  return option.misconception === null
    ? { status: "correct" }
    : { status: "misconception", misconception: option.misconception };
}

/** A question's Spanish prompt and, for each option, its label and feedback. */
export function questionText(questionId: QuestionId): {
  readonly prompt: string;
  readonly option: (optionId: string) => OptionText;
} {
  const { prompt, options } = QUESTION_TEXT[questionId];
  return {
    prompt,
    option: (optionId) => {
      const text = options[optionId];
      if (text === undefined) {
        throw new RangeError(
          `no text for ${questionId}'s option "${optionId}"`,
        );
      }
      return text;
    },
  };
}

function questionFor(questionId: QuestionId): Question {
  const question = QUESTIONS.find(({ id }) => id === questionId);
  if (question === undefined) {
    throw new RangeError(`no question with id "${questionId}"`);
  }
  return question;
}
