import { es } from "@/content/es";
import { MutualArrow } from "./mutual-arrow";
import { PausableAnimation } from "./pausable-animation";
import { SectionIllustration } from "./section-illustration";

const { illustration } = es.gravitation.sections.mutual;

// In the drawing's units: the top of the Earth, the apple and the arrows,
// which are the same length because the two forces are equal.
const SURFACE_Y = 150;
const APPLE_Y = 70;
const APPLE_RADIUS = 7;
const ARROW_LENGTH = 30;
const CENTRE_X = 120;

/**
 * Equal force arrows on the apple and the Earth, and only the apple moves
 * (spec 04, Decision 4). The apple rests at its lower point; the animation
 * starts it higher.
 */
export function MutualPicture() {
  return (
    <PausableAnimation buttonAt="top-left" width="max-w-sm">
      <SectionIllustration
        label={illustration.label}
        viewBox="0 20 240 180"
        caption={illustration.caption}
      >
        <defs>
          <marker
            id="force-head"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" className="fill-accent" />
          </marker>
        </defs>
        <circle
          cx={CENTRE_X}
          cy={SURFACE_Y + 160}
          r={160}
          className="fill-surface-raised stroke-line"
        />
        <MutualArrow
          x={CENTRE_X}
          fromY={SURFACE_Y}
          toY={SURFACE_Y - ARROW_LENGTH}
        />
        <g className="motion-safe:animate-apple-loop">
          <circle
            cx={CENTRE_X}
            cy={APPLE_Y}
            r={APPLE_RADIUS}
            className="fill-apple"
          />
          <MutualArrow
            x={CENTRE_X}
            fromY={APPLE_Y + APPLE_RADIUS}
            toY={APPLE_Y + APPLE_RADIUS + ARROW_LENGTH}
          />
        </g>
      </SectionIllustration>
    </PausableAnimation>
  );
}
