import {
  CANNON_LIMITS,
  type CannonField,
  type CannonOutcome,
  type CannonRequest,
  type CannonSettings,
  type FieldLimits,
} from "@/cannon";
import {
  goToStep,
  type LaunchResult,
  launchCannon,
  type NavigationResult,
  type SetResult,
  setCannon,
  type Transition,
} from "./lesson-session";
import type { LessonStore } from "./lesson-store";
import { STEP_IDS, type StepId } from "./steps";

/**
 * The lesson's controls, shared by the page's own buttons and spec 05's tutor
 * (spec 04, Decisions 12 to 14). Every change goes through the session's
 * transitions; there is no second path.
 */
export type LessonControls = {
  readonly cannon: {
    readonly limits: Readonly<Record<CannonField, FieldLimits>>;
    readonly set: (request: CannonRequest) => SetResult;
    /** An absent field keeps its current value, so `launch()` fires the current settings. */
    readonly launch: (request?: CannonRequest) => LaunchResult;
    readonly current: () => {
      readonly settings: CannonSettings;
      readonly lastLaunch:
        | (CannonSettings & { readonly outcome: CannonOutcome })
        | null;
    };
  };
  readonly navigation: {
    readonly steps: readonly StepId[];
    readonly current: () => StepId;
    readonly goToStep: (step: unknown) => NavigationResult;
  };
};

/** `navigate` pushes a history entry for a step, as a link does. */
export function createLessonControls(
  store: LessonStore,
  navigate: (step: StepId) => void,
): LessonControls {
  function apply<Result>({ session, result, navigateTo }: Transition<Result>) {
    store.replace(session);
    if (navigateTo !== null) {
      navigate(navigateTo);
    }
    return result;
  }

  return {
    cannon: {
      limits: CANNON_LIMITS,
      set: (request) => {
        const { session, result } = setCannon(store.getSession(), request);
        store.replace(session);
        return result;
      },
      launch: (request = {}) =>
        apply(launchCannon(store.getSession(), request)),
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
      steps: STEP_IDS,
      current: () => store.getSession().step,
      goToStep: (step) => apply(goToStep(store.getSession(), step)),
    },
  };
}
