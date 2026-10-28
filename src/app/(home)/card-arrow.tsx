export function CardArrow({ className }: { className: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className={`size-6 text-muted group-focus-within:text-accent group-hover:text-accent motion-safe:transition-colors ${className}`}
    >
      <path
        d="M3 10h14M11 4l6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
