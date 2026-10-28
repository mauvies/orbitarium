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
import type { QuestionId } from "@/lib/lesson/questions";
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

type Lesson = {
  readonly store: LessonStore;
  readonly controls: LessonControls;
  readonly launch: (request: CannonRequest) => LaunchResult;
  readonly answer: (questionId: QuestionId, optionId: string) => void;
  readonly clearEarlierPaths: () => void;
  readonly setPredictedPathShown: (shown: boolean) => void;
};

type TutorPanelState = {
  readonly open: boolean;
  readonly announcement: string;
  readonly suggestion: { readonly text: string } | null;
  readonly suggest: (text: string) => void;
  readonly setOpen: (open: boolean) => void;
};

const LessonContext = createContext<Lesson | null>(null);

const TutorPanelContext = createContext<TutorPanelState | null>(null);

interface Props {
  children: ReactNode;
}

export function LessonProvider({ children }: Props) {
  const [store] = useState(() => createLessonStore(initialSession()));
  const [isTutorOpen, setIsTutorOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const [suggestion, setSuggestion] =
    useState<TutorPanelState["suggestion"]>(null);

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
    () => ({
      open: isTutorOpen,
      setOpen: setIsTutorOpen,
      announcement,
      suggestion,
      suggest: (text: string) => {
        setSuggestion({ text });
        setIsTutorOpen(true);
      },
    }),
    [isTutorOpen, announcement, suggestion],
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

export function useAskTutor(): TutorPanelState["suggest"] {
  return useTutorPanel().suggest;
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
