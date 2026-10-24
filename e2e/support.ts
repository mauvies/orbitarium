import type { Locator, Page } from "@playwright/test";

/** The canvas's pixels as a data URL, to compare two moments. */
export function canvasSnapshot(canvas: Locator): Promise<string> {
  return canvas.evaluate((element: HTMLCanvasElement) => element.toDataURL());
}

/** Whether anything has been drawn on the canvas. */
export function hasDrawing(canvas: Locator): Promise<boolean> {
  return canvas.evaluate((element: HTMLCanvasElement) => {
    const blank = document.createElement("canvas");
    blank.width = element.width;
    blank.height = element.height;
    return element.toDataURL() !== blank.toDataURL();
  });
}

/** Waits for the browser to render `count` frames, instead of a fixed time. */
export function waitForFrames(page: Page, count: number): Promise<void> {
  return page.evaluate(async (frames) => {
    for (let i = 0; i < frames; i++) {
      await new Promise(requestAnimationFrame);
    }
  }, count);
}
