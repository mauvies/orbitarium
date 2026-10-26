import { CannonThumbnail } from "@/app/(home)/cannon-thumbnail";
import { es } from "@/content/es";

const { title, intro } = es.gravitation.steps.cannon;
const { cannon } = es.gravitation;

/**
 * Newton's cannon, in a band as wide as the page (spec 04, Decision 4): the
 * title, a short description and the cannon, with its controls beside the
 * canvas from 1,024 px and below it narrower. No questions. Prototype: a
 * static drawing and a note stand in for the canvas and the controls, which
 * come with the cannon.
 */
export function CannonBand() {
  return (
    <div className="py-12 lg:py-16">
      <section
        id="cannon"
        aria-labelledby="cannon-title"
        className="scroll-mt-8 rounded-2xl border border-line bg-surface p-5 lg:p-8"
      >
        <h2
          id="cannon-title"
          className="font-heading font-semibold text-section text-strong"
        >
          {title}
        </h2>
        <p className="mt-2 max-w-[60ch] text-lead">{intro}</p>
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <figure data-testid="cannon-canvas">
            <CannonThumbnail className="w-full" />
            <figcaption className="mt-3 text-muted text-small">
              {cannon.caption}
            </figcaption>
          </figure>
          <fieldset className="rounded-xl border border-line p-4 text-muted text-small">
            <legend className="sr-only">{cannon.controlsLabel}</legend>
            {cannon.controlsPlaceholder}
          </fieldset>
        </div>
      </section>
    </div>
  );
}
