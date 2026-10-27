import { es } from "@/content/es";
import {
  BALI_ANGLE,
  CENTRE_X,
  CENTRE_Y,
  MADRID_ANGLE,
  RADIUS,
} from "./falling-geometry";
import { FallingLineToCentre } from "./falling-line-to-centre";
import { FallingTree } from "./falling-tree";
import { PausableAnimation } from "./pausable-animation";
import { SectionIllustration } from "./section-illustration";

const { illustration } = es.gravitation.sections.falling;

/**
 * Two large apple trees about 117° apart. The animation loops, in
 * sequence: Madrid's tree and its falling apple, then Bali's, then the
 * lines from both apples to the Earth's centre. Each tree is drawn at the top
 * and turned about the centre, so its apple falls along its own "down". With
 * reduced motion, the final frame.
 */
export function FallingPicture() {
  return (
    <PausableAnimation width="max-w-xl">
      <SectionIllustration
        label={illustration.label}
        viewBox="0 20 380 240"
        wide
      >
        <circle
          cx={CENTRE_X}
          cy={CENTRE_Y}
          r={RADIUS}
          className="fill-surface-raised stroke-line"
        />
        {/* Under the trees, so the apples cover the ends of the lines. */}
        <g className="motion-safe:animate-reveal-late">
          <FallingLineToCentre angle={MADRID_ANGLE} />
          <FallingLineToCentre angle={BALI_ANGLE} />
          <circle cx={CENTRE_X} cy={CENTRE_Y} r={3} className="fill-accent" />
        </g>
        <FallingTree
          angle={MADRID_ANGLE}
          label={illustration.madrid}
          groupAnimation="motion-safe:animate-tree-first"
          fallAnimation="motion-safe:animate-fall-first"
        />
        <FallingTree
          angle={BALI_ANGLE}
          label={illustration.bali}
          groupAnimation="motion-safe:animate-tree-second"
          fallAnimation="motion-safe:animate-fall-second"
        />
      </SectionIllustration>
    </PausableAnimation>
  );
}
