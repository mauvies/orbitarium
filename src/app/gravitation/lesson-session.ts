import {
  type Applied,
  CANNON_PRESETS,
  type CannonOutcome,
  type CannonRequest,
  type CannonSettings,
  launchOutcome,
  launchState,
  type Rejected,
  resolveRequest,
  type Trace,
  traceLaunch,
} from "@/cannon";
import { CANNON_STOP_RADIUS } from "./cannon-view";
import { type Answers, grade, type QuestionId } from "./questions";
import { parseStep, STEP_IDS, type StepId } from "./steps";

// Spec 04, Decision 11: the current path and up to four faint ones.
export const RECENT_LAUNCHES = 5;

export type Launch = {
  readonly id: number;
  readonly settings: CannonSettings;
  readonly outcome: CannonOutcome;
  readonly trace: Trace;
};

/**
 * What the lesson remembers while the learner moves between its steps. It
 * lives in the `/gravitation` layout, so it resets on reload (spec 04,
 * Decision 2).
 */
export type LessonSession = {
  readonly step: StepId;
  readonly cannon: CannonSettings;
  /** Oldest first. */
  readonly launches: readonly Launch[];
  readonly nextLaunchId: number;
  readonly answers: Answers;
};

export type SetResult = ({ readonly status: "set" } & Applied) | Rejected;

export type LaunchResult =
  | ({ readonly status: "launched"; readonly outcome: CannonOutcome } & Applied)
  | Rejected;

export type NavigationResult =
  | { readonly status: "moved"; readonly step: StepId }
  | {
      readonly status: "rejected";
      readonly field: "step";
      readonly reason: string;
    };

/** A change of session, what its caller gets back, and the step the browser must move to, if any. */
export type Transition<Result> = {
  readonly session: LessonSession;
  readonly result: Result;
  readonly navigateTo: StepId | null;
};

const STEP_REASON = `must be one of ${STEP_IDS.join(", ")}`;

export function initialSession(step: StepId): LessonSession {
  return {
    step,
    cannon: CANNON_PRESETS.ballistic,
    launches: [],
    nextLaunchId: 1,
    answers: {},
  };
}

/**
 * Moves to `value` as a link would (spec 04, Decision 14). The tutor's input
 * is untyped, so the step is checked at runtime. Moving to the current step
 * adds no history entry.
 */
export function goToStep(
  session: LessonSession,
  value: unknown,
): Transition<NavigationResult> {
  const step = typeof value === "string" ? parseStep(value) : null;
  if (step === null) {
    return {
      session,
      result: { status: "rejected", field: "step", reason: STEP_REASON },
      navigateTo: null,
    };
  }
  return {
    session: syncStep(session, step),
    result: { status: "moved", step },
    navigateTo: step === session.step ? null : step,
  };
}

/** Follows the URL after a link or the browser's Back button. */
export function syncStep(session: LessonSession, step: StepId): LessonSession {
  return step === session.step ? session : { ...session, step };
}

/** Moves the cannon's controls without firing (spec 04, Decision 12). */
export function setCannon(
  session: LessonSession,
  request: CannonRequest,
): { readonly session: LessonSession; readonly result: SetResult } {
  const resolved = resolveRequest(session.cannon, request);
  if (resolved.status === "rejected") {
    return { session, result: resolved };
  }
  const { speedKmPerSecond, angleDegrees, clamped } = resolved;
  return {
    session: { ...session, cannon: { speedKmPerSecond, angleDegrees } },
    result: { status: "set", speedKmPerSecond, angleDegrees, clamped },
  };
}

/**
 * Applies `request` as `setCannon` does, then fires: the outcome is known at
 * once and the path is traced now, so the canvas can play it whenever it
 * mounts (spec 04, Decision 10). A launch from another step moves to the
 * cannon, so the learner sees it (Decision 14).
 */
export function launchCannon(
  session: LessonSession,
  request: CannonRequest,
): Transition<LaunchResult> {
  const resolved = resolveRequest(session.cannon, request);
  if (resolved.status === "rejected") {
    return { session, result: resolved, navigateTo: null };
  }
  const { speedKmPerSecond, angleDegrees, clamped } = resolved;
  const settings = { speedKmPerSecond, angleDegrees };
  const outcome = launchOutcome(settings);
  const launch: Launch = {
    id: session.nextLaunchId,
    settings,
    outcome,
    trace: traceLaunch(launchState(settings), {
      stopRadius: CANNON_STOP_RADIUS,
    }),
  };
  return {
    session: {
      ...session,
      step: "cannon",
      cannon: settings,
      launches: [...session.launches, launch].slice(-RECENT_LAUNCHES),
      nextLaunchId: session.nextLaunchId + 1,
    },
    result: { status: "launched", ...settings, clamped, outcome },
    navigateTo: session.step === "cannon" ? null : "cannon",
  };
}

/**
 * Keeps only the last launch: the faint paths go, and the cannon's last
 * launch, which the tutor reads, stays (spec 04, Decision 11).
 */
export function clearEarlierPaths(session: LessonSession): LessonSession {
  if (session.launches.length <= 1) {
    return session;
  }
  return { ...session, launches: session.launches.slice(-1) };
}

/**
 * Records the learner's first answer; later ones are ignored, because the
 * first tells us what they believed (spec 04, Decision 5).
 */
export function answerQuestion(
  session: LessonSession,
  questionId: QuestionId,
  optionId: string,
): LessonSession {
  grade(questionId, optionId);
  if (session.answers[questionId] !== undefined) {
    return session;
  }
  return {
    ...session,
    answers: { ...session.answers, [questionId]: optionId },
  };
}
