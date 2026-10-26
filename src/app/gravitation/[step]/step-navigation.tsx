import Link from "next/link";
import { es } from "@/content/es";
import {
  nextStep,
  previousStep,
  STEP_IDS,
  type StepId,
  stepPath,
} from "../steps";

const { steps, navigation } = es.gravitation;

/** The five steps, in order, with the current one marked (spec 04, Decision 3). */
export function StepList({ current }: { current: StepId }) {
  return (
    <nav aria-label={navigation.label} className="pt-6">
      <ol className="flex flex-wrap gap-x-1 gap-y-1 text-small">
        {STEP_IDS.map((step, index) => (
          <li key={step}>
            <Link
              href={stepPath(step)}
              aria-current={step === current ? "step" : undefined}
              className="inline-block rounded-[10px] px-2 py-1 decoration-2 decoration-accent underline-offset-6 hover:text-strong aria-[current=step]:text-strong aria-[current=step]:underline"
            >
              <span aria-hidden="true">{navigation.number(index + 1)}</span>
              {steps[step].title}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Previous and next, so the learner can always move on without answering. */
export function StepPager({ current }: { current: StepId }) {
  const previous = previousStep(current);
  const next = nextStep(current);
  return (
    <div className="mt-12 flex flex-wrap justify-between gap-4">
      {previous !== null && (
        <Link
          href={stepPath(previous)}
          className="text-accent underline underline-offset-4"
        >
          {navigation.previous(steps[previous].title)}
        </Link>
      )}
      {next !== null && (
        <Link
          href={stepPath(next)}
          className="ml-auto text-accent underline underline-offset-4"
        >
          {navigation.next(steps[next].title)}
        </Link>
      )}
    </div>
  );
}
