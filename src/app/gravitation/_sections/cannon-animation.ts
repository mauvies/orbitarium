import { finalFrame, type Trace, type TraceFrame, traceFrame } from "@/cannon";
import { startAnimationLoop } from "@/drawing/animation-loop";
import { type CanvasSize, observeCanvasSize } from "@/drawing/canvas-size";
import { readThemeColors } from "@/drawing/theme-colors";
import { type CanvasTransform, fitTransform } from "@/drawing/transform";
import { CANNON_VIEW_RADIUS } from "../cannon-view";
import { drawEarth, drawMountain, drawShot, drawShotPath } from "./cannon-draw";

const PADDING_PX = 16;
const MS_PER_SECOND = 1_000;

// Fixed and centred on the Earth (spec 04, Decision 10).
const VIEW_BOUNDS = {
  minX: -CANNON_VIEW_RADIUS,
  maxX: CANNON_VIEW_RADIUS,
  minY: -CANNON_VIEW_RADIUS,
  maxY: CANNON_VIEW_RADIUS,
};

export type CannonAnimation = {
  /** Plays `trace` from its start, or shows it whole when `animate` is false. */
  readonly show: (trace: Trace | null, animate: boolean) => void;
  readonly stop: () => void;
};

type View = {
  readonly size: CanvasSize;
  readonly transform: CanvasTransform;
};

/**
 * Draws the Earth, the cannon and the last shot on `canvas`, outside React,
 * as the gallery does (spec 03, Decision 5). The shot is revealed at one
 * screen second per unit of engine time (spec 04, Decision 10), and the loop
 * stops once nothing moves.
 */
export function startCannonAnimation(
  canvas: HTMLCanvasElement,
): CannonAnimation {
  const context = canvas.getContext("2d");
  if (context === null) {
    throw new Error("the canvas has no 2D context");
  }
  const colors = readThemeColors(canvas);
  let view: View | null = null;
  let trace: Trace | null = null;
  let animate = false;
  let elapsedTime = 0;

  const currentFrame = (): TraceFrame | null => {
    if (trace === null) {
      return null;
    }
    return animate ? traceFrame(trace, elapsedTime) : finalFrame(trace);
  };

  const draw = (frame: TraceFrame | null) => {
    if (view === null) {
      return;
    }
    const { size, transform } = view;
    context.setTransform(size.pixelRatio, 0, 0, size.pixelRatio, 0, 0);
    context.clearRect(0, 0, size.width, size.height);
    drawEarth(context, transform, {
      fill: colors.surfaceRaised,
      edge: colors.line,
    });
    drawMountain(context, transform, colors.muted);
    if (trace !== null && frame !== null) {
      drawShotPath(
        context,
        trace.points,
        frame.revealedPoints,
        transform,
        colors.accent,
      );
      drawShot(context, frame.shot, transform, colors.strong);
    }
  };

  const stopObserving = observeCanvasSize(canvas, (size) => {
    view = viewFor(size);
    draw(currentFrame());
  });
  const loop = startAnimationLoop((elapsedMs) => {
    elapsedTime += elapsedMs / MS_PER_SECOND;
    const frame = currentFrame();
    draw(frame);
    return frame !== null && !frame.finished;
  });

  return {
    show: (nextTrace, nextAnimate) => {
      trace = nextTrace;
      animate = nextAnimate;
      elapsedTime = 0;
      loop.requestFrame();
    },
    stop: () => {
      loop.stop();
      stopObserving();
    },
  };
}

/** Nothing to draw on a canvas without a size, such as one not laid out yet. */
function viewFor(size: CanvasSize): View | null {
  if (size.width === 0 || size.height === 0) {
    return null;
  }
  return {
    size,
    transform: fitTransform(VIEW_BOUNDS, size.width, size.height, PADDING_PX),
  };
}
