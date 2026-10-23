import type { ReactNode } from "react";
import { type SvgFrame, svgUnitsPerPixel } from "@/drawing/orbit-path";

// The widest a plate is drawn: one of two gallery cards at 768 px. Drawings
// are simplified, and dots sized, for this width.
export const PLATE_WIDTH_PX = 360;

/**
 * Wide above a card's text (the gallery); beside text from 640 px (the home
 * page), where it is 4:3 to match the text's height, and wide below that.
 */
export type PlateShape = "wide" | "beside-text";

// The ratio dots are sized for: the one beside the text, where they are seen
// at their smallest.
const ASPECT_RATIO: Record<PlateShape, number> = {
  wide: 2,
  "beside-text": 4 / 3,
};
const ASPECT_CLASS: Record<PlateShape, string> = {
  wide: "aspect-2/1",
  "beside-text": "aspect-2/1 sm:aspect-4/3",
};

/** View box units per pixel of a drawing framed by `frame` on this plate. */
export function plateUnitsPerPixel(frame: SvgFrame, shape: PlateShape): number {
  return svgUnitsPerPixel(
    frame,
    PLATE_WIDTH_PX,
    PLATE_WIDTH_PX / ASPECT_RATIO[shape],
  );
}

/**
 * The recessed plate behind a drawing (docs/design/visual-style.md, "Orbit
 * card"). Decorative: the card's text says what it shows.
 */
export function Plate({
  frame,
  shape,
  className = "",
  children,
}: {
  frame: SvgFrame;
  shape: PlateShape;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`rounded-xl bg-bg-bottom ${className}`}>
      <svg
        viewBox={`${frame.x} ${frame.y} ${frame.width} ${frame.height}`}
        className={`w-full ${ASPECT_CLASS[shape]}`}
        aria-hidden="true"
      >
        {children}
      </svg>
    </div>
  );
}
