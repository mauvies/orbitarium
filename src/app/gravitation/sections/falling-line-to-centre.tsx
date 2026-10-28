import { APPLE_RADIUS, CENTRE_X, CENTRE_Y, RADIUS } from "./falling-geometry";

interface Props {
  angle: number;
}

export function FallingLineToCentre({ angle }: Props) {
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
