import {
  CANNON_LIMITS,
  type CannonField,
  type CannonOutcome,
  type CannonRequest,
  type CannonSettings,
  type FieldLimits,
} from "@/cannon";
import { type LearnerProfile, learnerProfile } from "./learner-profile";
import {
  type LaunchResult,
  launchCannon,
  type SetResult,
  setCannon,
} from "./lesson-session";
import type { LessonStore } from "./lesson-store";
import { parseSection, SECTION_IDS, type SectionId } from "./section-ids";

export type NavigationResult =
  | { readonly status: "moved"; readonly section: SectionId }
  | {
      readonly status: "rejected";
      readonly field: "section";
      readonly reason: string;
    };

/** The page as the controls see it: where the learner is, and how to move. */
export type LessonView = {
  /** Scrolls to the part and replaces the anchor, without a history entry. */
  readonly scrollToSection: (section: SectionId) => void;
  readonly focusHeading: (section: SectionId) => void;
  /** Says in the tutor's panel which part the page moved to. */
  readonly announceSection: (section: SectionId) => void;
  readonly isTutorOpen: () => boolean;
  readonly sectionAtTop: () => SectionId;
  readonly isCannonInView: () => boolean;
};

/**
 * The lesson's controls for spec 05's tutor (spec 04, Decisions 12 to 14).
 * Every change goes through the session's transitions, which the page's own
 * buttons also use; only the tutor's requests move the page.
 */
export type LessonControls = {
  readonly cannon: {
    readonly limits: Readonly<Record<CannonField, FieldLimits>>;
    readonly set: (request: CannonRequest) => SetResult;
    /**
     * An absent field keeps its current value, so `launch()` fires the
     * current settings. Scrolls to the cannon first if it is out of view.
     */
    readonly launch: (request?: CannonRequest) => LaunchResult;
    readonly current: () => {
      readonly settings: CannonSettings;
      readonly lastLaunch:
        | (CannonSettings & { readonly outcome: CannonOutcome })
        | null;
    };
  };
  readonly navigation: {
    readonly sections: readonly SectionId[];
    /** The part at the top of the viewport; after `goToSection(x)`, `x`. */
    readonly current: () => SectionId;
    /** The tutor's input is untyped, so the part is checked at runtime. */
    readonly goToSection: (section: unknown) => NavigationResult;
  };
  /** Read-only: the tutor adapts to it, and only the learner's answers change it. */
  readonly learnerProfile: () => LearnerProfile;
};

const SECTION_REASON = `must be one of ${SECTION_IDS.join(", ")}`;

export function createLessonControls(
  store: LessonStore,
  view: LessonView,
): LessonControls {
  /**
   * Moves the page to `section` for the tutor. With the panel open, focus
   * stays in it and the move is announced instead (spec 04, Decision 14).
   */
  function moveTo(section: SectionId): void {
    view.scrollToSection(section);
    if (view.isTutorOpen()) {
      view.announceSection(section);
    } else {
      view.focusHeading(section);
    }
  }

  return {
    cannon: {
      limits: CANNON_LIMITS,
      set: (request) => {
        const { session, result } = setCannon(store.getSession(), request);
        store.replace(session);
        return result;
      },
      launch: (request = {}) => {
        const { session, result } = launchCannon(store.getSession(), request);
        store.replace(session);
        // Spec 04, Decision 14: the learner sees what the tutor fired.
        if (result.status === "launched" && !view.isCannonInView()) {
          moveTo("cannon");
        }
        return result;
      },
      current: () => {
        const { cannon, launches } = store.getSession();
        const last = launches.at(-1);
        return {
          settings: cannon,
          lastLaunch:
            last === undefined
              ? null
              : { ...last.settings, outcome: last.outcome },
        };
      },
    },
    navigation: {
      sections: SECTION_IDS,
      current: view.sectionAtTop,
      goToSection: (value) => {
        const section = typeof value === "string" ? parseSection(value) : null;
        if (section === null) {
          return {
            status: "rejected",
            field: "section",
            reason: SECTION_REASON,
          };
        }
        moveTo(section);
        return { status: "moved", section };
      },
    },
    learnerProfile: () => learnerProfile(store.getSession().answers),
  };
}
