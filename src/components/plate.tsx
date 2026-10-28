import type { ReactNode } from "react";
import { type SvgFrame, svgUnitsPerPixel } from "@/drawing/orbit-path";

export type PlateShape = "wide" | "beside-text";

const ASPECT_RATIO: Record<PlateShape, number> = {
  wide: 5 / 2,
  "beside-text": 4 / 3,
};

const ASPECT_CLASS: Record<PlateShape, string> = {
  wide: "aspect-2/1 lg:aspect-5/2",
  "beside-text": "aspect-2/1 sm:aspect-4/3",
};

export const PLATE_WIDTH_PX = 360;

export function plateUnitsPerPixel(frame: SvgFrame, shape: PlateShape): number {
  return svgUnitsPerPixel(
    frame,
    PLATE_WIDTH_PX,
    PLATE_WIDTH_PX / ASPECT_RATIO[shape],
  );
}

interface Props {
  frame: SvgFrame;
  shape: PlateShape;
  className?: string;
  children: ReactNode;
}

export function Plate({ frame, shape, className = "", children }: Props) {
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
