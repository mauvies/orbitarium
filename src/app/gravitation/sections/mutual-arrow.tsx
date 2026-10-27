export function MutualArrow({
  x,
  fromY,
  toY,
}: {
  x: number;
  fromY: number;
  toY: number;
}) {
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
