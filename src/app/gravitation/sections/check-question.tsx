"use client";

import { useEffect, useRef, useState } from "react";
import { useHydrated } from "@/components/use-hydrated";
import { es } from "@/content/es";
import { grade, type Question, questionText } from "@/lib/lesson/questions";
import {
  useAnswerQuestion,
  useAskTutor,
  useLessonSession,
} from "../lesson-provider";
import { QuestionExplanation } from "./question-explanation";

type FocusTarget = "explanation" | "options" | null;

const ui = es.gravitation.question;

interface Props {
  question: Question;
}

export function CheckQuestion({ question }: Props) {
  const [shownOption, setShownOption] = useState<string | null>(null);
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [focusTarget, setFocusTarget] = useState<FocusTarget>(null);
  const explanation = useRef<HTMLOutputElement>(null);
  const options = useRef<HTMLDivElement>(null);

  const answered = useLessonSession().answers[question.id];
  const answer = useAnswerQuestion();
  const suggestToTutor = useAskTutor();
  const isHydrated = useHydrated();

  const text = questionText(question.id);
  const isLocked = answered !== undefined;
  const explained = isLocked && !isBrowsing ? (shownOption ?? answered) : null;

  const handleChoose = (optionId: string) => {
    if (!isLocked) {
      answer(question.id, optionId);
    }

    setShownOption(optionId);
    setIsBrowsing(false);
    setFocusTarget("explanation");
  };

  const handleShowOptions = () => {
    setIsBrowsing(true);
    setFocusTarget("options");
  };

  const handleAskTutor = (optionId: string) => {
    const sectionTitle = es.gravitation.sections[question.section].title;

    suggestToTutor(
      grade(question.id, optionId).status === "correct"
        ? ui.askAboutCorrectAnswer(sectionTitle)
        : ui.askAboutWrongAnswer(sectionTitle),
    );
  };

  useEffect(() => {
    if (focusTarget === "explanation") {
      explanation.current?.focus();
    } else if (focusTarget === "options") {
      options.current?.querySelector("button")?.focus();
    }
  }, [focusTarget]);

  return (
    <fieldset className="mt-6 max-w-xl rounded-xl border border-line bg-surface px-4 py-3">
      <legend className="float-left w-full font-medium text-strong">
        {text.prompt}
      </legend>
      <div className="clear-left grid pt-1.5">
        {question.options.map((option) => (
          <div
            key={option.id}
            aria-hidden="true"
            className="invisible col-start-1 row-start-1"
          >
            <QuestionExplanation question={question} optionId={option.id} />
          </div>
        ))}
        <div
          ref={options}
          className={`col-start-1 row-start-1 flex flex-col ${explained === null ? "" : "invisible"}`}
        >
          {question.options.map((option) => {
            const isAnswer = answered === option.id;

            return (
              <button
                key={option.id}
                type="button"
                disabled={!isHydrated || explained !== null}
                onClick={() => handleChoose(option.id)}
                className="flex items-start gap-2.5 rounded-lg px-2 py-1 text-left text-small enabled:cursor-pointer enabled:hover:bg-surface-raised enabled:hover:text-strong"
              >
                <span
                  aria-hidden="true"
                  className={`mt-0.5 size-4 shrink-0 rounded-full border ${isAnswer ? "border-accent bg-accent" : "border-muted"}`}
                />
                <span>
                  {text.option(option.id).label}
                  {isAnswer && (
                    <>
                      {" "}
                      <span className="text-accent">{`(${ui.yourAnswer})`}</span>
                    </>
                  )}
                </span>
              </button>
            );
          })}
        </div>
        {/* Always present, even empty: a live region must exist before its text arrives to be announced. */}
        <output
          ref={explanation}
          tabIndex={-1}
          className="col-start-1 row-start-1 self-start outline-none"
        >
          {explained !== null && (
            <QuestionExplanation
              question={question}
              optionId={explained}
              actions={{
                onShowOptions: handleShowOptions,
                onAskTutor: () => handleAskTutor(explained),
              }}
            />
          )}
        </output>
      </div>
    </fieldset>
  );
}
