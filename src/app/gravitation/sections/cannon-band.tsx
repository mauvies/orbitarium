import { es } from "@/content/es";
import { CannonCanvas } from "./cannon-canvas";
import { CannonPanel } from "./cannon-panel";

const { title } = es.gravitation.steps.cannon;
const { cannon } = es.gravitation;

/**
 * Newton's cannon, in a band as wide as the page (spec 04, Decision 4): the
 * title and the cannon, with its controls beside the canvas from 1,024 px
 * and below it narrower. No questions. The caption is for screen readers
 * below 640 px, to leave the canvas and the controls in view.
 */
export function CannonBand() {
  return (
    <div className="py-12 lg:py-16">
      <section
        id="cannon"
        aria-labelledby="cannon-title"
        className="scroll-mt-8 rounded-2xl border border-line bg-surface p-4 lg:p-8"
      >
        <h2
          id="cannon-title"
          className="font-heading font-semibold text-section text-strong"
        >
          {title}
        </h2>
        <div className="mt-3 grid gap-6 lg:mt-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <figure data-testid="cannon-canvas">
            <CannonCanvas />
            <figcaption className="sr-only sm:not-sr-only sm:mt-3 sm:text-muted sm:text-small">
              {cannon.caption}
            </figcaption>
          </figure>
          <CannonPanel />
        </div>
      </section>
    </div>
  );
}
