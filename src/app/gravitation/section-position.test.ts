import { describe, expect, it } from "vitest";
import { SECTION_IDS, type SectionId } from "@/lib/lesson/section-ids";
import { isMostlyVisible, sectionAt, TOP_LINE_PX } from "./section-position";

const VIEWPORT_HEIGHT_PX = 740;
// A part the browser just scrolled to: its scroll margin, plus subpixel
// rounding.
const JUST_SCROLLED_TO_PX = 32.6;

/** Each part's top, in viewport pixels, in the page's order. */
function tops(...values: readonly number[]) {
  return values.map((top, i) => {
    const section: SectionId | undefined = SECTION_IDS[i];
    if (section === undefined) {
      throw new RangeError(`no part at index ${i}`);
    }
    return { section, top };
  });
}

// Spec 04, Decision 14 and L11: the part at the top of the viewport.
describe("sectionAt", () => {
  it("the part at the top is the last one whose top is above the line", () => {
    expect(
      sectionAt(tops(-900, -300, 400, 900, 1400, 2400), TOP_LINE_PX, false),
    ).toBe("mutual");
  });

  it("above the first part, it is the first", () => {
    expect(
      sectionAt(tops(300, 900, 1500, 2100, 2700, 3700), TOP_LINE_PX, false),
    ).toBe("falling");
  });

  it("a part just scrolled to counts as at the top despite rounding", () => {
    expect(
      sectionAt(
        tops(-1200, -600, JUST_SCROLLED_TO_PX, 600, 1100, 2100),
        TOP_LINE_PX,
        false,
      ),
    ).toBe("moon");
  });

  it("at the bottom of the page, it is the last part", () => {
    expect(
      sectionAt(tops(-3000, -2400, -1800, -1200, -600, 200), TOP_LINE_PX, true),
    ).toBe("law");
  });
});

// Spec 04, Decision 14: the cannon is in view when at least half of its
// canvas, or of the viewport if the canvas is taller, is visible.
describe("isMostlyVisible", () => {
  it("at least half visible", () => {
    expect(
      isMostlyVisible({ top: -100, height: 300 }, VIEWPORT_HEIGHT_PX),
    ).toBe(true);
    expect(isMostlyVisible({ top: 590, height: 300 }, VIEWPORT_HEIGHT_PX)).toBe(
      true,
    );
  });

  it("less than half", () => {
    expect(
      isMostlyVisible({ top: -200, height: 300 }, VIEWPORT_HEIGHT_PX),
    ).toBe(false);
    expect(isMostlyVisible({ top: 600, height: 300 }, VIEWPORT_HEIGHT_PX)).toBe(
      false,
    );
  });

  it("with the sheet open, the cannon is measured against the page above it", () => {
    // 360 × 740 with the tutor's sheet open: the page shows above 333 px.
    const pageAboveSheetPx = 333;
    const canvasAfterScroll = { top: 88, height: 290 };

    expect(isMostlyVisible(canvasAfterScroll, pageAboveSheetPx)).toBe(true);
    expect(isMostlyVisible({ top: 220, height: 290 }, pageAboveSheetPx)).toBe(
      false,
    );
  });

  it("a rect taller than the viewport is measured against the viewport", () => {
    expect(
      isMostlyVisible({ top: -200, height: 2000 }, VIEWPORT_HEIGHT_PX),
    ).toBe(true);
    expect(
      isMostlyVisible({ top: 500, height: 2000 }, VIEWPORT_HEIGHT_PX),
    ).toBe(false);
  });
});
