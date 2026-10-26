import { CannonThumbnail } from "@/app/(home)/cannon-thumbnail";
import { es } from "@/content/es";
import { SectionHeading, StepIntro, StepQuestions } from "./step-layout";

const { title, intro } = es.gravitation.steps.cannon;

/**
 * The second part of «¿Llega hasta la Luna?», laid out like the other parts:
 * text and questions on the left, the cannon on the right. Prototype: a
 * static drawing stands in for the interactive cannon.
 */
export function CannonPart() {
  return (
    <section
      id="cannon"
      aria-labelledby="cannon-title"
      className="scroll-mt-8 border-line border-t py-12 lg:py-16"
    >
      <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-16">
        <figure className="mx-auto w-full max-w-md">
          <CannonThumbnail className="w-full" />
          <figcaption className="mt-3 text-muted text-small">
            {es.gravitation.cannonPlaceholder}
          </figcaption>
        </figure>
        <div className="lg:order-first">
          <SectionHeading id="cannon" title={title} level={3} />
          <StepIntro>{intro}</StepIntro>
          <StepQuestions step="cannon" />
        </div>
      </div>
    </section>
  );
}
