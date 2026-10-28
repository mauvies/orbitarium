interface Props {
  x: number;
  fromY: number;
  toY: number;
}

export function MutualArrow({ x, fromY, toY }: Props) {
  return (
    <line
      x1={x}
      y1={fromY}
      x2={x}
      y2={toY}
      className="stroke-accent"
      strokeWidth={1.25}
      markerEnd="url(#force-head)"
    />
  );
}
