import {
  type Applied,
  CANNON_PRESETS,
  type CannonOutcome,
  type CannonRequest,
  type CannonSettings,
  launchOutcome,
  type Rejected,
  resolveRequest,
  type Trace,
} from "@/cannon";
import { viewTrace } from "./cannon-view";
import { type Answers, grade, type QuestionId } from "./questions";

// Spec 04, Decision 11: the current path and up to four faint ones.
export const RECENT_LAUNCHES = 5;

export type Launch = {
  readonly id: number;
  readonly settings: CannonSettings;
  readonly outcome: CannonOutcome;
  readonly trace: Trace;
};

/**
 * What the lesson remembers while the learner reads it. It lives in the
 * `/gravitation` layout, so it resets on reload (spec 04, Decision 2). Where
 * the learner is on the page is not part of it: that is the page's view
 * (Decision 14).
 */
export type LessonSession = {
  readonly cannon: CannonSettings;
  /** Oldest first. */
  readonly launches: readonly Launch[];
  readonly nextLaunchId: number;
  readonly answers: Answers;
  /** The learner's preference, on at first (spec 04, Decision 11). */
  readonly showPredictedPath: boolean;
};

export type SetResult = ({ readonly status: "set" } & Applied) | Rejected;

export type LaunchResult =
  | ({ readonly status: "launched"; readonly outcome: CannonOutcome } & Applied)
  | Rejected;

export function initialSession(): LessonSession {
  return {
    cannon: CANNON_PRESETS.ballistic,
    launches: [],
    nextLaunchId: 1,
    answers: {},
    showPredictedPath: true,
  };
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
  const { speedKmPerSecond, angleDegrees, altitudeKm, clamped } = resolved;
  const settings = { speedKmPerSecond, angleDegrees, altitudeKm };
  return {
    session: { ...session, cannon: settings },
    result: { status: "set", ...settings, clamped },
  };
}

/**
 * Applies `request` as `setCannon` does, then fires: the outcome is known at
 * once and the path is traced now, so the canvas can play it whenever it
 * mounts (spec 04, Decision 10).
 */
export function launchCannon(
  session: LessonSession,
  request: CannonRequest,
): { readonly session: LessonSession; readonly result: LaunchResult } {
  const resolved = resolveRequest(session.cannon, request);
  if (resolved.status === "rejected") {
    return { session, result: resolved };
  }
  const { speedKmPerSecond, angleDegrees, altitudeKm, clamped } = resolved;
  const settings = { speedKmPerSecond, angleDegrees, altitudeKm };
  const outcome = launchOutcome(settings);
  const launch: Launch = {
    id: session.nextLaunchId,
    settings,
    outcome,
    trace: viewTrace(settings),
  };
  return {
    session: {
      ...session,
      cannon: settings,
      launches: [...session.launches, launch].slice(-RECENT_LAUNCHES),
      nextLaunchId: session.nextLaunchId + 1,
    },
    result: { status: "launched", ...settings, clamped, outcome },
  };
}

/**
 * Shows or hides the predicted path. Like clearing the paths, it is the
 * learner's alone, not one of the tutor's controls (spec 04, Decision 11).
 */
export function setPredictedPathShown(
  session: LessonSession,
  shown: boolean,
): LessonSession {
  return shown === session.showPredictedPath
    ? session
    : { ...session, showPredictedPath: shown };
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
