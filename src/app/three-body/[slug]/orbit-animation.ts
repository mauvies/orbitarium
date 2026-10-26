import type { OrbitPath } from "@/drawing/orbit-path";
import type { OrbitPreset } from "@/orbits";
import { startAnimationLoop } from "./animation-loop";
import { type CanvasSize, observeCanvasSize } from "./canvas-size";
import type { DetailPreferences } from "./detail-preferences";
import { drawBodies, drawPath, drawTrail, pathShape } from "./draw";
import { advanceAnimation, startAnimation } from "./orbit-frame";
import { readThemeColors } from "./theme-colors";
import { type CanvasTransform, fitTransform } from "./transform";

/**
 * The canvas's largest width in CSS pixels: `orbit-canvas.tsx` caps it there
 * (`max-w-160`), and the page simplifies the path for it (spec 03, Decision 4).
 */
export const CANVAS_MAX_WIDTH_PX = 640;

const PADDING_PX = 16;

export type PlayerControls = DetailPreferences & { readonly playing: boolean };

export type OrbitAnimation = {
  readonly setControls: (controls: PlayerControls) => void;
  readonly stop: () => void;
};

/** What depends on the canvas's size, rebuilt only when it changes. */
type View = {
  readonly size: CanvasSize;
  readonly transform: CanvasTransform;
  readonly path: Path2D;
};

/**
 * Animates `orbit` on `canvas`: the simulation lives here, outside React,
 * and a control change reaches it through `setControls` (spec 03,
 * Decision 5). `onCollision` is called once, when two bodies meet and the
 * animation stops (spec 03, Decision 12).
 */
export function startOrbitAnimation(
  canvas: HTMLCanvasElement,
  orbit: OrbitPreset,
  path: OrbitPath,
  initialControls: PlayerControls,
  onCollision: () => void,
): OrbitAnimation {
  const context = canvas.getContext("2d");
  if (context === null) {
    throw new Error("the canvas has no 2D context");
  }
  const colors = readThemeColors(canvas);
  let controls = initialControls;
  let state = startAnimation(orbit);
  let view: View | null = null;

  const draw = () => {
    if (view === null) {
      return;
    }
    const { size, transform } = view;
    context.setTransform(size.pixelRatio, 0, 0, size.pixelRatio, 0, 0);
    context.clearRect(0, 0, size.width, size.height);
    if (controls.showPath) {
      drawPath(context, view.path, colors.accent);
    }
    if (controls.showTrail) {
      drawTrail(context, state.trail, transform, colors.accent);
    }
    drawBodies(
      context,
      state.playback.state.bodies.map(({ position }) => position),
      transform,
      colors.strong,
    );
  };

  const stopObserving = observeCanvasSize(canvas, (size) => {
    view = viewFor(size, path);
    draw();
  });
  const loop = startAnimationLoop((elapsedMs) => {
    if (controls.playing && !state.collided) {
      state = advanceAnimation(state, elapsedMs, controls);
      if (state.collided) {
        onCollision();
      }
    }
    draw();
    return controls.playing && !state.collided;
  });

  return {
    setControls: (next) => {
      controls = next;
      loop.requestFrame();
    },
    stop: () => {
      loop.stop();
      stopObserving();
    },
  };
}

/** Nothing to draw on a canvas without a size, such as one not laid out yet. */
function viewFor(size: CanvasSize, path: OrbitPath): View | null {
  if (size.width === 0 || size.height === 0) {
    return null;
  }
  const transform = fitTransform(
    path.bounds,
    size.width,
    size.height,
    PADDING_PX,
  );
  return { size, transform, path: pathShape(path.bodies, transform) };
}
