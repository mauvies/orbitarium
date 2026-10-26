/** The canvas's size in CSS pixels, and the device pixels per CSS pixel. */
export type CanvasSize = {
  readonly width: number;
  readonly height: number;
  readonly pixelRatio: number;
};

/**
 * Keeps the canvas's backing store at its CSS size times the device pixel
 * ratio, so lines stay sharp, and calls `onResize` whenever it changes.
 * Returns a function that stops observing.
 */
export function observeCanvasSize(
  canvas: HTMLCanvasElement,
  onResize: (size: CanvasSize) => void,
): () => void {
  const resize = () => {
    const { width, height } = canvas.getBoundingClientRect();
    const pixelRatio = devicePixelRatio;
    // Setting the backing store clears it, so `onResize` must redraw.
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    onResize({ width, height, pixelRatio });
  };
  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  return () => observer.disconnect();
}
