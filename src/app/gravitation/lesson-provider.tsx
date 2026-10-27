"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import type { CannonRequest } from "@/cannon";
import { createLessonControls, type LessonControls } from "./lesson-controls";
import {
  answerQuestion,
  clearEarlierPaths,
  initialSession,
  type LaunchResult,
  type LessonSession,
  launchCannon,
  setPredictedPathShown,
} from "./lesson-session";
import { createLessonStore, type LessonStore } from "./lesson-store";
import { createLessonView } from "./lesson-view";
import type { QuestionId } from "./questions";

type Lesson = {
  readonly store: LessonStore;
  /** The tutor's way in (spec 05); they may move the page. */
  readonly controls: LessonControls;
  /**
   * The band's own launch: the same transition as the tutor's, but it never
   * scrolls or moves focus, because the learner is looking at the cannon
   * (spec 04, Decision 12).
   */
  readonly launch: (request: CannonRequest) => LaunchResult;
  /** Answering is the learner's alone, so it is not one of the tutor's controls. */
  readonly answer: (questionId: QuestionId, optionId: string) => void;
  /** Like answering, clearing the faint paths is the learner's alone. */
  readonly clearEarlierPaths: () => void;
  /** The learner's preference too: the tutor never shows the prediction. */
  readonly setPredictedPathShown: (shown: boolean) => void;
};

const LessonContext = createContext<Lesson | null>(null);

/**
 * Whether the tutor's panel is open, and its last announcement: page state,
 * not lesson state, kept apart so opening the panel re-renders only what
 * shows it (spec 04, Decisions 14 and 15).
 */
type TutorPanelState = {
  readonly open: boolean;
  readonly setOpen: (open: boolean) => void;
  readonly announcement: string;
};

const TutorPanelContext = createContext<TutorPanelState | null>(null);

/**
 * Keeps the lesson's session while the learner reads it (spec 04, Decision
 * 2) and exposes its controls.
 */
export function LessonProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => createLessonStore(initialSession()));
  const [tutorOpen, setTutorOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const controls = useMemo(
    () =>
      createLessonControls(
        store,
        // Cleared first, so the same move twice is announced twice.
        createLessonView((message) => {
          setAnnouncement("");
          requestAnimationFrame(() => setAnnouncement(message));
        }),
      ),
    [store],
  );
  const tutorPanel = useMemo(
    () => ({ open: tutorOpen, setOpen: setTutorOpen, announcement }),
    [tutorOpen, announcement],
  );
  const lesson = useMemo(
    () => ({
      store,
      controls,
      launch: (request: CannonRequest) => {
        const { session, result } = launchCannon(store.getSession(), request);
        store.replace(session);
        return result;
      },
      answer: (questionId: QuestionId, optionId: string) =>
        store.replace(answerQuestion(store.getSession(), questionId, optionId)),
      clearEarlierPaths: () =>
        store.replace(clearEarlierPaths(store.getSession())),
      setPredictedPathShown: (shown: boolean) =>
        store.replace(setPredictedPathShown(store.getSession(), shown)),
    }),
    [store, controls],
  );
  return (
    <LessonContext value={lesson}>
      <TutorPanelContext value={tutorPanel}>{children}</TutorPanelContext>
    </LessonContext>
  );
}

export function useLessonControls(): LessonControls {
  return useLesson().controls;
}

export function useLaunchCannon(): Lesson["launch"] {
  return useLesson().launch;
}

export function useAnswerQuestion(): Lesson["answer"] {
  return useLesson().answer;
}

export function useClearEarlierPaths(): Lesson["clearEarlierPaths"] {
  return useLesson().clearEarlierPaths;
}

export function useSetPredictedPathShown(): Lesson["setPredictedPathShown"] {
  return useLesson().setPredictedPathShown;
}

export function useLessonSession(): LessonSession {
  const { store } = useLesson();
  return useSyncExternalStore(
    store.subscribe,
    store.getSession,
    store.getSession,
  );
}

export function useTutorPanel(): TutorPanelState {
  const tutorPanel = useContext(TutorPanelContext);
  if (tutorPanel === null) {
    throw new Error("useTutorPanel must be used inside LessonProvider");
  }
  return tutorPanel;
}

function useLesson(): Lesson {
  const lesson = useContext(LessonContext);
  if (lesson === null) {
    throw new Error("useLesson must be used inside LessonProvider");
  }
  return lesson;
}
