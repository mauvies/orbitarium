import type { SectionId } from "@/lib/lesson/section-ids";

export type SectionTop = {
  readonly section: SectionId;
  /** In viewport pixels: negative once the part has scrolled past the top. */
  readonly top: number;
};

/** How far below the viewport's top a part stops when scrolled to. */
export const SECTION_SCROLL_MARGIN_PX = 32;

/**
 * The line a part's top must reach to be the one at the top: its scroll
 * margin, plus room for subpixel rounding, so the part just scrolled to
 * counts (spec 04, Decision 14).
 */
export const TOP_LINE_PX = SECTION_SCROLL_MARGIN_PX + 8;

// Spec 04, Decision 14: not half, which let the tutor's sheet hide where the
// shot lands; not all, which a phone's canvas misses by a pixel.
const IN_VIEW_SHARE = 0.9;

/**
 * The part at the top of the viewport: the last one whose top is at or above
 * `line`, or the first part if none is. At the bottom of the page the last
 * part cannot reach the line, so it is the last part (spec 04, Decision 14).
 */
export function sectionAt(
  tops: readonly SectionTop[],
  line: number,
  isAtBottom: boolean,
): SectionId {
  const first = tops[0];
  const last = tops.at(-1);

  if (first === undefined || last === undefined) {
    throw new RangeError("tops must hold at least one part");
  }

  if (isAtBottom) {
    return last.section;
  }

  return tops.findLast(({ top }) => top <= line)?.section ?? first.section;
}

/**
 * Whether at least 90 % of a rect is in the viewport: of its height, or of
 * the viewport if the rect is taller (spec 04, Decision 14).
 */
export function isMostlyVisible(
  { top, height }: { readonly top: number; readonly height: number },
  viewportHeight: number,
): boolean {
  const visible = Math.min(top + height, viewportHeight) - Math.max(top, 0);

  return visible >= Math.min(height, viewportHeight) * IN_VIEW_SHARE;
}
