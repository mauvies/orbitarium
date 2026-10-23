import type { Vec2 } from "@/physics";

/** A rectangle in simulation units, with y pointing up. */
export type Bounds = {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
};

/** From simulation units to canvas pixels: x' = offsetX + x·scale, y' = offsetY − y·scale. */
export type CanvasTransform = {
  readonly scale: number;
  readonly offsetX: number;
  readonly offsetY: number;
};

/**
 * Fits `bounds` whole and centred into a `width` × `height` canvas (CSS
 * pixels), leaving `padding` pixels on every side and keeping its aspect
 * ratio. The canvas's y points down, the simulation's up.
 */
export function fitTransform(
  bounds: Bounds,
  width: number,
  height: number,
  padding: number,
): CanvasTransform {
  requirePositive(width, "width");
  requirePositive(height, "height");
  const boundsWidth = bounds.maxX - bounds.minX;
  const boundsHeight = bounds.maxY - bounds.minY;
  if (!(boundsWidth > 0 && boundsHeight > 0)) {
    throw new RangeError(
      `bounds must have a positive width and height, got ${boundsWidth} × ${boundsHeight}`,
    );
  }
  if (!(padding >= 0 && 2 * padding < Math.min(width, height))) {
    throw new RangeError(
      `padding must be at least 0 and leave room to draw, got ${padding}`,
    );
  }
  const scale = Math.min(
    (width - 2 * padding) / boundsWidth,
    (height - 2 * padding) / boundsHeight,
  );
  return {
    scale,
    offsetX: width / 2 - ((bounds.minX + bounds.maxX) / 2) * scale,
    offsetY: height / 2 + ((bounds.minY + bounds.maxY) / 2) * scale,
  };
}

export function toCanvas(
  { x, y }: Vec2,
  { scale, offsetX, offsetY }: CanvasTransform,
): Vec2 {
  return { x: offsetX + x * scale, y: offsetY - y * scale };
}

function requirePositive(value: number, field: string): void {
  if (!(Number.isFinite(value) && value > 0)) {
    throw new RangeError(
      `${field} must be a positive finite number, got ${value}`,
    );
  }
}
