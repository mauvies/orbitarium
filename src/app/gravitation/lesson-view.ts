import type { LessonView } from "./lesson-controls";
import {
  isMostlyVisible,
  SECTION_IDS,
  type SectionId,
  sectionAt,
  TOP_LINE_PX,
} from "./section-ids";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
// Browsers that do not fire `scrollend` have finished a smooth scroll to any
// part of the lesson well within this.
const SMOOTH_SCROLL_MAX_MS = 1_500;

/**
 * The lesson page as the controls see it (spec 04, Decision 14). It is the
 * only module that touches the DOM, and it reads it only when called, never
 * on load.
 */
export function createLessonView(): LessonView {
  // While a smooth scroll is under way the target is not at the top yet, so
  // `sectionAtTop` reports it until the scroll ends: after `goToSection(x)`,
  // `current()` is `x`.
  let target: SectionId | null = null;

  return {
    scrollToSection: (section) => {
      const part = partOf(section);
      const smooth = !matchMedia(REDUCED_MOTION).matches;
      target = smooth ? section : null;
      part.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
        block: "start",
      });
      // The page is still scrolling; focusing must not jump it.
      headingOf(part).focus({ preventScroll: true });
      history.replaceState(null, "", `#${section}`);
      if (smooth) {
        whenScrollEnds(() => {
          target = null;
        });
      }
    },
    sectionAtTop: () => {
      if (target !== null) {
        return target;
      }
      const tops = SECTION_IDS.map((section) => ({
        section,
        top: partOf(section).getBoundingClientRect().top,
      }));
      const atBottom =
        Math.ceil(scrollY + innerHeight) >=
        document.documentElement.scrollHeight;
      return sectionAt(tops, TOP_LINE_PX, atBottom);
    },
    isCannonInView: () => {
      const canvas = partOf("cannon").querySelector("canvas");
      if (canvas === null) {
        throw new Error("the cannon band has no canvas");
      }
      const { top, height } = canvas.getBoundingClientRect();
      return isMostlyVisible({ top, height }, innerHeight);
    },
  };
}

function partOf(section: SectionId): HTMLElement {
  const part = document.getElementById(section);
  if (part === null) {
    throw new Error(`the lesson has no part #${section}`);
  }
  return part;
}

function headingOf(part: HTMLElement): HTMLElement {
  const heading = part.querySelector("h2");
  if (heading === null) {
    throw new Error(`the part #${part.id} has no heading`);
  }
  return heading;
}

function whenScrollEnds(callback: () => void): void {
  if ("onscrollend" in window) {
    addEventListener("scrollend", callback, { once: true });
  } else {
    setTimeout(callback, SMOOTH_SCROLL_MAX_MS);
  }
}
