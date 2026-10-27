import { es } from "@/content/es";
import { SECTION_SCROLL_MARGIN_PX } from "../section-position";
import { CannonCanvas } from "./cannon-canvas";
import { CannonPanel } from "./cannon-panel";

const { title } = es.gravitation.sections.cannon;
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
        // The same margin the part at the top is measured against (spec 04,
        // Decision 14).
        style={{ scrollMarginTop: SECTION_SCROLL_MARGIN_PX }}
        className="rounded-2xl border border-line bg-surface p-4 lg:p-8"
      >
        {/* Focusable, so the tutor's navigation can move focus to it (spec 04, Decision 14). */}
        <h2
          id="cannon-title"
          tabIndex={-1}
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
