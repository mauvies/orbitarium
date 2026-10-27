import { es } from "@/content/es";
import { SectionIllustration } from "./section-illustration";

const { illustration } = es.gravitation.sections.moon;

// In the drawing's units. The bodies are to scale with each other (the
// Moon's radius is 0.27 of the Earth's); the distance between them is not.
const EARTH_RADIUS = 52;
const MOON_RADIUS = EARTH_RADIUS * 0.27;
const EARTH_X = 70;
const MOON_X = 330;
const BODIES_Y = 80;
const BREAK_X = 200;

/**
 * The Earth, drawn large, and the Moon at the same scale, with the distance
 * between them cut by a break mark (spec 04, Decision 4).
 */
export function MoonPicture() {
  return (
    <SectionIllustration
      label={illustration.label}
      viewBox="0 0 360 170"
      wide
      caption={illustration.caption}
    >
      <line
        x1={EARTH_X + EARTH_RADIUS}
        y1={BODIES_Y}
        x2={BREAK_X - 6}
        y2={BODIES_Y}
        className="stroke-muted"
        strokeDasharray="3 4"
      />
      <line
        x1={BREAK_X + 6}
        y1={BODIES_Y}
        x2={MOON_X - MOON_RADIUS}
        y2={BODIES_Y}
        className="stroke-muted"
        strokeDasharray="3 4"
      />
      {/* The break mark: two slashes where the distance is cut. */}
      <path
        d={`M ${BREAK_X - 9} ${BODIES_Y + 8} L ${BREAK_X - 3} ${BODIES_Y - 8} M ${BREAK_X + 3} ${BODIES_Y + 8} L ${BREAK_X + 9} ${BODIES_Y - 8}`}
        className="stroke-body"
        strokeWidth={1.5}
      />
      <circle
        cx={EARTH_X}
        cy={BODIES_Y}
        r={EARTH_RADIUS}
        className="fill-surface-raised stroke-line"
      />
      <circle
        cx={MOON_X}
        cy={BODIES_Y}
        r={MOON_RADIUS}
        className="fill-strong"
      />
      <text
        x={EARTH_X}
        y={BODIES_Y + EARTH_RADIUS + 20}
        textAnchor="middle"
        className="fill-body text-[12px]"
      >
        {illustration.earth}
      </text>
      <text
        x={MOON_X}
        y={BODIES_Y + MOON_RADIUS + 20}
        textAnchor="middle"
        className="fill-body text-[12px]"
      >
        {illustration.moon}
      </text>
      <text
        x={BREAK_X}
        y={BODIES_Y - 16}
        textAnchor="middle"
        className="fill-muted text-[12px]"
      >
        {illustration.distance}
      </text>
    </SectionIllustration>
  );
}
