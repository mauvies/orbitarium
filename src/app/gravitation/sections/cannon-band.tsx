import { es } from "@/content/es";
import { SECTION_SCROLL_MARGIN_PX } from "../section-position";
import { CannonCanvas } from "./cannon-canvas";
import { CannonPanel } from "./cannon-panel";

const { title } = es.gravitation.sections.cannon;
const { cannon } = es.gravitation;

export function CannonBand() {
  return (
    <div className="py-12 lg:py-16">
      <section
        id="cannon"
        aria-labelledby="cannon-title"
        style={{ scrollMarginTop: SECTION_SCROLL_MARGIN_PX }}
        className="rounded-2xl border border-line bg-surface p-4 lg:p-8"
      >
        <h2
          id="cannon-title"
          tabIndex={-1}
          className="font-heading font-semibold text-section text-strong"
        >
          {title}
        </h2>
        <p className="sr-only sm:not-sr-only sm:mt-2 sm:max-w-[70ch]">
          {cannon.description}
        </p>
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
