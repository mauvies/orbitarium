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

/**
 * The WCAG contrast ratio between two computed colours, given as
 * `rgb(r, g, b)` or `rgba(r, g, b, a)`; transparency is not supported.
 */
export function contrastRatio(first: string, second: string): number {
  const [lighter, darker] = [luminance(first), luminance(second)].sort(
    (a, b) => b - a,
  );
  if (lighter === undefined || darker === undefined) {
    throw new Error("contrastRatio needs two colours");
  }
  return (lighter + 0.05) / (darker + 0.05);
}

function luminance(color: string): number {
  const channels = color.match(/[\d.]+/g)?.map(Number);
  const [r, g, b, alpha = 1] = channels ?? [];
  if (r === undefined || g === undefined || b === undefined || alpha !== 1) {
    throw new Error(`color must be an opaque rgb() colour, got ${color}`);
  }
  const [red, green, blue] = [r, g, b].map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (red ?? 0) + 0.7152 * (green ?? 0) + 0.0722 * (blue ?? 0);
}

/**
 * How many pixels of the canvas are close to the theme's accent, a warm
 * yellow: strong red, medium green, little blue.
 */
export function accentPixels(canvas: Locator): Promise<number> {
  return canvas.evaluate((element: HTMLCanvasElement) => {
    const context = element.getContext("2d");
    if (context === null) {
      throw new Error("the canvas has no 2D context");
    }
    const { data } = context.getImageData(0, 0, element.width, element.height);
    let count = 0;
    for (let i = 0; i < data.length; i += 4) {
      const [red = 0, green = 0, blue = 0] = [
        data[i],
        data[i + 1],
        data[i + 2],
      ];
      if (red > 180 && green > 120 && blue < 90) {
        count++;
      }
    }
    return count;
  });
}
