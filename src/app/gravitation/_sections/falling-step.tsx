import { es } from "@/content/es";
import { PausableAnimation } from "./pausable-animation";
import { StepIllustration, StepIntro, StepQuestions } from "./step-layout";

const { intro, illustration } = es.gravitation.steps.falling;

// In the drawing's units. The fall distance matches the `fall-down`
// keyframes (40 units).
const CENTRE_X = 190;
const CENTRE_Y = 150;
const RADIUS = 80;
const TRUNK_HEIGHT = 46;
const CROWN_RADIUS = 15;
const TRUNK_OFFSET_X = 13;
const APPLE_RADIUS = 4;
// Madrid and Bali are about 117° apart along the Earth's surface.
const MADRID_ANGLE = -58.5;
const BALI_ANGLE = 58.5;
const LABEL_DISTANCE = RADIUS + TRUNK_HEIGHT + 2 * CROWN_RADIUS + 8;

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
      <StepIllustration label={illustration.label} viewBox="0 20 380 240" wide>
        <circle
          cx={CENTRE_X}
          cy={CENTRE_Y}
          r={RADIUS}
          className="fill-surface-raised stroke-line"
        />
        {/* Under the trees, so the apples cover the ends of the lines. */}
        <g className="motion-safe:animate-reveal-late">
          <LineToCentre angle={MADRID_ANGLE} />
          <LineToCentre angle={BALI_ANGLE} />
          <circle cx={CENTRE_X} cy={CENTRE_Y} r={3} className="fill-accent" />
        </g>
        <Tree
          angle={MADRID_ANGLE}
          label={illustration.madrid}
          groupAnimation="motion-safe:animate-tree-first"
          fallAnimation="motion-safe:animate-fall-first"
        />
        <Tree
          angle={BALI_ANGLE}
          label={illustration.bali}
          groupAnimation="motion-safe:animate-tree-second"
          fallAnimation="motion-safe:animate-fall-second"
        />
      </StepIllustration>
    </PausableAnimation>
  );
}

export function FallingText() {
  return (
    <>
      <StepIntro>{intro}</StepIntro>
      <StepQuestions step="falling" />
    </>
  );
}

/** A tree on the ground, its apple resting below the crown. */
function Tree({
  angle,
  label,
  groupAnimation,
  fallAnimation,
}: {
  angle: number;
  label: string;
  groupAnimation: string;
  fallAnimation: string;
}) {
  const top = CENTRE_Y - RADIUS;
  const crownY = top - TRUNK_HEIGHT;
  const radians = (angle * Math.PI) / 180;
  return (
    <g className={groupAnimation}>
      <g transform={`rotate(${angle} ${CENTRE_X} ${CENTRE_Y})`}>
        <line
          x1={CENTRE_X + TRUNK_OFFSET_X}
          y1={top}
          x2={CENTRE_X + TRUNK_OFFSET_X}
          y2={crownY}
          className="stroke-muted"
          strokeWidth={4}
          strokeLinecap="round"
        />
        <circle
          cx={CENTRE_X + TRUNK_OFFSET_X}
          cy={crownY}
          r={CROWN_RADIUS}
          className="fill-line"
        />
        <circle
          cx={CENTRE_X}
          cy={top - APPLE_RADIUS}
          r={APPLE_RADIUS}
          className={`fill-apple ${fallAnimation}`}
        />
      </g>
      <text
        x={CENTRE_X + Math.sin(radians) * LABEL_DISTANCE}
        y={CENTRE_Y - Math.cos(radians) * LABEL_DISTANCE}
        textAnchor="middle"
        className="fill-body text-[12px]"
      >
        {label}
      </text>
    </g>
  );
}

function LineToCentre({ angle }: { angle: number }) {
  return (
    <line
      x1={CENTRE_X}
      y1={CENTRE_Y - RADIUS - APPLE_RADIUS}
      x2={CENTRE_X}
      y2={CENTRE_Y}
      transform={`rotate(${angle} ${CENTRE_X} ${CENTRE_Y})`}
      className="stroke-accent"
      strokeDasharray="4 5"
      strokeWidth={1.5}
    />
  );
}
