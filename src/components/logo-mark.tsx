// Three identical ellipses crossing at the centre (docs/design/visual-style.md,
// "Logo"); src/app/icon.svg draws the same for the browser's tab.
const ROTATIONS = [0, 60, 120] as const;

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <g className="fill-none stroke-accent" strokeWidth={2}>
        {ROTATIONS.map((angle) => (
          <ellipse
            key={angle}
            cx={32}
            cy={32}
            rx={27}
            ry={10}
            transform={`rotate(${angle} 32 32)`}
          />
        ))}
      </g>
    </svg>
  );
}
