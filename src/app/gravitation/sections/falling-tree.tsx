import {
  APPLE_RADIUS,
  CENTRE_X,
  CENTRE_Y,
  CROWN_RADIUS,
  LABEL_DISTANCE,
  RADIUS,
  TRUNK_HEIGHT,
  TRUNK_OFFSET_X,
} from "./falling-geometry";

interface Props {
  angle: number;
  label: string;
  groupAnimation: string;
  fallAnimation: string;
}

/** A tree on the ground, its apple resting below the crown. */
export function FallingTree({
  angle,
  label,
  groupAnimation,
  fallAnimation,
}: Props) {
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
