import { es } from "@/content/es";
import { StepIntro, StepQuestions } from "./step-layout";

const { intro } = es.gravitation.steps.law;
const { law } = es.gravitation;

/**
 * The law as large styled text, no math library (spec 04, Decision 4). Screen
 * readers get the formula as a sentence instead of its symbols.
 */
export function LawPicture() {
  return (
    <figure className="mx-auto max-w-sm text-center">
      <p className="sr-only">{law.spokenFormula}</p>
      {/* A fraction as on paper: the masses over the squared distance. */}
      <div
        aria-hidden="true"
        className="flex items-center justify-center gap-3 whitespace-nowrap font-heading font-medium text-section text-strong lg:text-title"
      >
        <span>
          {law.formula.force} {law.formula.equals} {law.formula.constant}{" "}
          {law.formula.times}
        </span>
        <span className="inline-flex flex-col items-center">
          <span className="border-strong border-b px-3 pb-1">
            {law.formula.mass}
            <sub>{law.formula.first}</sub> {law.formula.times}{" "}
            {law.formula.mass}
            <sub>{law.formula.second}</sub>
          </span>
          <span className="pt-1">
            {law.formula.distance}
            <sup>{law.formula.squared}</sup>
          </span>
        </span>
      </div>
      <figcaption className="mt-4 text-muted text-small">
        {law.constantValue}
      </figcaption>
    </figure>
  );
}

export function LawText() {
  return (
    <>
      <StepIntro>{intro}</StepIntro>
      <p className="mt-3 max-w-[60ch]">{law.constant}</p>
      <StepQuestions step="law" />
    </>
  );
}
