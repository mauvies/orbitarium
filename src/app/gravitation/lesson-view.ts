import { es } from "@/content/es";
import { SECTION_IDS, type SectionId } from "@/lib/lesson/section-ids";
import type { LessonView } from "./lesson-controls";
import { isMostlyVisible, sectionAt, TOP_LINE_PX } from "./section-position";
import { TUTOR_PANEL_ID } from "./tutor-ids";

const { sections, tutor } = es.gravitation;

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
// Browsers that do not fire `scrollend` have finished a smooth scroll to any
// part of the lesson well within this.
const SMOOTH_SCROLL_MAX_MS = 1_500;

/**
 * The lesson page as the controls see it (spec 04, Decision 14). It is the
 * only module that touches the DOM, and it reads it only when called, never
 * on load. `announce` writes into the tutor panel's live region.
 */
export function createLessonView(
  announce: (message: string) => void,
): LessonView {
  // While a smooth scroll is under way the target is not at the top yet, so
  // `sectionAtTop` reports it until the scroll ends: after `goToSection(x)`,
  // `current()` is `x`.
  let target: SectionId | null = null;

  return {
    scrollToSection: (section) => {
      const part = partOf(section);
      const isSmooth = !matchMedia(REDUCED_MOTION).matches;
      target = isSmooth ? section : null;

      part.scrollIntoView({
        behavior: isSmooth ? "smooth" : "auto",
        block: "start",
      });

      history.replaceState(null, "", `#${section}`);

      if (isSmooth) {
        whenScrollEnds(() => {
          target = null;
        });
      }
    },
    focusHeading: (section) => {
      // The page may still be scrolling; focusing must not jump it.
      headingOf(partOf(section)).focus({ preventScroll: true });
    },
    announceSection: (section) => {
      announce(tutor.movedTo(sections[section].title));
    },
    isTutorOpen: () => tutorPanel()?.open ?? false,
    sectionAtTop: () => {
      if (target !== null) {
        return target;
      }

      const tops = SECTION_IDS.map((section) => ({
        section,
        top: partOf(section).getBoundingClientRect().top,
      }));

      const isAtBottom =
        Math.ceil(scrollY + innerHeight) >=
        document.documentElement.scrollHeight;

      return sectionAt(tops, TOP_LINE_PX, isAtBottom);
    },
    isCannonInView: () => {
      const canvas = partOf("cannon").querySelector("canvas");

      if (canvas === null) {
        throw new Error("the cannon band has no canvas");
      }

      const { top, height } = canvas.getBoundingClientRect();

      return isMostlyVisible({ top, height }, visiblePageBottom());
    },
  };
}

function tutorPanel(): HTMLDialogElement | null {
  const panel = document.getElementById(TUTOR_PANEL_ID);

  return panel instanceof HTMLDialogElement ? panel : null;
}

/**
 * Where the visible page ends: the top of the tutor's sheet when it is open
 * below 1,280 px, the viewport's bottom otherwise (spec 04, Decision 14). The
 * side panel from 1,280 px pushes the page instead of covering it.
 */
function visiblePageBottom(): number {
  const panel = tutorPanel();

  if (panel?.open) {
    const { left, top } = panel.getBoundingClientRect();

    if (left <= 0) {
      return top;
    }
  }

  return innerHeight;
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
