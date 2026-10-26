import type { ReactNode } from "react";
import { questionsFor } from "../questions";
import type { StepId } from "../steps";
import { CheckQuestion } from "./check-question";

/**
 * One part of the lesson: its text and questions on one side, its picture on
 * the other. Narrow screens show the picture first; from 1,024 px the two sit
 * side by side, and `textFirst` puts the text on the left.
 */
export function LessonSection({
  id,
  title,
  picture,
  textFirst = false,
  children,
}: {
  id: StepId;
  title: string;
  picture: ReactNode;
  textFirst?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-8 py-12 lg:py-16"
    >
      <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div>{picture}</div>
        <div className={textFirst ? "lg:order-first" : ""}>
          <h2
            id={`${id}-title`}
            className="font-heading font-semibold text-section text-strong"
          >
            {title}
          </h2>
          {children}
        </div>
      </div>
    </section>
  );
}

/**
 * An SVG illustration with its text alternative and an optional caption.
 * `wide` is for a drawing wider than tall.
 */
export function StepIllustration({
  label,
  viewBox,
  wide = false,
  caption,
  children,
}: {
  label: string;
  viewBox: string;
  wide?: boolean;
  caption?: string;
  children: ReactNode;
}) {
  return (
    <figure className={`mx-auto ${wide ? "max-w-xl" : "max-w-sm"}`}>
      <svg role="img" aria-label={label} viewBox={viewBox} className="w-full">
        {children}
      </svg>
      {caption !== undefined && (
        <figcaption className="mt-3 text-muted text-small">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

export function StepIntro({ children }: { children: string }) {
  return <p className="mt-4 max-w-[60ch] text-lead">{children}</p>;
}

/** The part's question. */
export function StepQuestions({ step }: { step: StepId }) {
  return questionsFor(step).map((question) => (
    <CheckQuestion key={question.id} question={question} continueTo={null} />
  ));
}
