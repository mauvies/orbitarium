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
          <SectionHeading id={id} title={title} level={2} />
          {children}
        </div>
      </div>
    </section>
  );
}

/** A part's heading: h2 for a section, h3 for the second part of one. */
export function SectionHeading({
  id,
  title,
  level,
}: {
  id: StepId;
  title: string;
  level: 2 | 3;
}) {
  const Heading = level === 2 ? "h2" : "h3";
  return (
    <Heading
      id={`${id}-title`}
      className={`font-heading font-semibold text-strong ${level === 2 ? "text-section" : "text-card"}`}
    >
      {title}
    </Heading>
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

/** The part's questions. The prediction waits for the cannon. */
export function StepQuestions({ step }: { step: StepId }) {
  return questionsFor(step)
    .filter(({ feedback }) => feedback === "on-answer")
    .map((question) => (
      <CheckQuestion key={question.id} question={question} continueTo={null} />
    ));
}
