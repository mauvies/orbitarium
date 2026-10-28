import type { ReactNode } from "react";

interface Props {
  label: string;
  viewBox: string;
  wide?: boolean;
  caption?: string;
  children: ReactNode;
}

/**
 * An SVG illustration with its text alternative and an optional caption.
 * `wide` is for a drawing wider than tall.
 */
export function SectionIllustration({
  label,
  viewBox,
  wide = false,
  caption,
  children,
}: Props) {
  return (
    <figure className={`mx-auto ${wide ? "max-w-xl" : "max-w-sm"}`}>
      <svg role="img" aria-label={label} viewBox={viewBox} className="w-full">
        {children}
      </svg>
      {caption !== undefined && (
        <figcaption className="mt-3 text-muted text-small">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
