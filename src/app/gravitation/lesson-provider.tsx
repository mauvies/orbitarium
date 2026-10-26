"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { createLessonControls, type LessonControls } from "./lesson-controls";
import {
  answerQuestion,
  initialSession,
  type LessonSession,
  syncStep,
} from "./lesson-session";
import { createLessonStore, type LessonStore } from "./lesson-store";
import type { QuestionId } from "./questions";
import { parseStep, type StepId, stepPath } from "./steps";

type Lesson = {
  readonly store: LessonStore;
  readonly controls: LessonControls;
  /** Answering is the learner's alone, so it is not one of the tutor's controls. */
  readonly answer: (questionId: QuestionId, optionId: string) => void;
};

const LessonContext = createContext<Lesson | null>(null);

/**
 * Keeps the lesson's session while the learner moves between steps (spec 04,
 * Decision 2) and exposes its controls.
 */
export function LessonProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const step = stepFromPathname(usePathname());
  const [store] = useState(() => createLessonStore(initialSession(step)));
  const controls = useMemo(
    () => createLessonControls(store, (next) => router.push(stepPath(next))),
    [store, router],
  );
  useEffect(() => {
    store.replace(syncStep(store.getSession(), step));
  }, [store, step]);
  const lesson = useMemo(
    () => ({
      store,
      controls,
      answer: (questionId: QuestionId, optionId: string) =>
        store.replace(answerQuestion(store.getSession(), questionId, optionId)),
    }),
    [store, controls],
  );
  return <LessonContext value={lesson}>{children}</LessonContext>;
}

export function useLessonControls(): LessonControls {
  return useLesson().controls;
}

export function useAnswerQuestion(): Lesson["answer"] {
  return useLesson().answer;
}

export function useLessonSession(): LessonSession {
  const { store } = useLesson();
  return useSyncExternalStore(
    store.subscribe,
    store.getSession,
    store.getSession,
  );
}

function useLesson(): Lesson {
  const lesson = useContext(LessonContext);
  if (lesson === null) {
    throw new Error("useLesson must be used inside LessonProvider");
  }
  return lesson;
}

function stepFromPathname(pathname: string): StepId {
  const step = parseStep(pathname.split("/").at(-1) ?? "");
  if (step === null) {
    throw new RangeError(`pathname is not a lesson step: ${pathname}`);
  }
  return step;
}
