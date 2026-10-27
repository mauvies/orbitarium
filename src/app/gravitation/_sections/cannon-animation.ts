import { finalFrame, type Trace, type TraceFrame, traceFrame } from "@/cannon";
import { startAnimationLoop } from "@/drawing/animation-loop";
import { type CanvasSize, observeCanvasSize } from "@/drawing/canvas-size";
import { readThemeColors } from "@/drawing/theme-colors";
import { type CanvasTransform, fitTransform } from "@/drawing/transform";
import { CANNON_VIEW_RADIUS } from "../cannon-view";
import {
  drawEarlierPath,
  drawEarth,
  drawMountain,
  drawShot,
  drawShotPath,
} from "./cannon-draw";

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
  /** The earlier launches' paths, drawn faint under the current one. */
  readonly setEarlierPaths: (traces: readonly Trace[]) => void;
  readonly stop: () => void;
};

type View = {
  readonly size: CanvasSize;
  readonly transform: CanvasTransform;
};

/**
 * Draws the Earth, the cannon and the shots on `canvas`, outside React, as
 * the gallery does (spec 03, Decision 5). The current shot is revealed at one
 * screen second per unit of engine time (spec 04, Decision 10), and the loop
 * stops once nothing moves. `onOutcomeShown` is called once per `show`,
 * when the shot's outcome becomes visible (Decision 11).
 */
export function startCannonAnimation(
  canvas: HTMLCanvasElement,
  onOutcomeShown: () => void,
): CannonAnimation {
  const context = canvas.getContext("2d");
  if (context === null) {
    throw new Error("the canvas has no 2D context");
  }
  const colors = readThemeColors(canvas);
  let view: View | null = null;
  let trace: Trace | null = null;
  let earlierPaths: readonly Trace[] = [];
  let animate = false;
  let elapsedTime = 0;
  let outcomeReported = false;

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
    for (const earlier of earlierPaths) {
      drawEarlierPath(context, earlier.points, transform, colors.accent);
    }
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
    if (frame?.outcomeShown && !outcomeReported) {
      outcomeReported = true;
      onOutcomeShown();
    }
    return frame !== null && !frame.finished;
  });

  return {
    show: (nextTrace, nextAnimate) => {
      trace = nextTrace;
      animate = nextAnimate;
      elapsedTime = 0;
      outcomeReported = false;
      loop.requestFrame();
    },
    setEarlierPaths: (traces) => {
      earlierPaths = traces;
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
    // No margin: paths reach the canvas's edge and are cut there.
    transform: fitTransform(VIEW_BOUNDS, size.width, size.height, 0),
  };
}
