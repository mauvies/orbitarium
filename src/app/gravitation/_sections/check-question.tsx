"use client";

import { useEffect, useRef, useState } from "react";
import { es } from "@/content/es";
import { useAnswerQuestion, useLessonSession } from "../lesson-provider";
import { grade, type Question, questionText } from "../questions";
import type { StepId } from "../steps";
import { useHydrated } from "../use-hydrated";

const ui = es.gravitation.question;

type FocusTarget = "explanation" | "options" | null;

/**
 * A single-choice check question (spec 04, Decision 5). One click answers,
 * and the first answer is the one recorded. Its explanation then takes the
 * options' place; «Ver opciones» brings them back, with that answer marked,
 * so the learner can read the other explanations.
 */
export function CheckQuestion({
  question,
}: {
  question: Question;
  continueTo: StepId | null;
}) {
  const answered = useLessonSession().answers[question.id];
  const answer = useAnswerQuestion();
  const hydrated = useHydrated();
  const [shownOption, setShownOption] = useState<string | null>(null);
  const [browsing, setBrowsing] = useState(false);
  const [focusTarget, setFocusTarget] = useState<FocusTarget>(null);
  const explanation = useRef<HTMLOutputElement>(null);
  const options = useRef<HTMLDivElement>(null);
  const text = questionText(question.id);
  const locked = answered !== undefined;
  const explained = locked && !browsing ? (shownOption ?? answered) : null;

  // The control that was used disappears, so focus moves to what replaced it
  // instead of falling back to the start of the page.
  useEffect(() => {
    if (focusTarget === "explanation") {
      explanation.current?.focus();
    } else if (focusTarget === "options") {
      options.current?.querySelector("button")?.focus();
    }
  }, [focusTarget]);

  function choose(optionId: string): void {
    if (!locked) {
      answer(question.id, optionId);
    }
    setShownOption(optionId);
    setBrowsing(false);
    setFocusTarget("explanation");
  }

  function showOptions(): void {
    setBrowsing(true);
    setFocusTarget("options");
  }

  return (
    <fieldset className="mt-6 max-w-xl rounded-xl border border-line bg-surface px-4 py-3">
      {/* Floated, so the legend sits inside the box instead of across its border. */}
      <legend className="float-left w-full font-medium text-strong">
        {text.prompt}
      </legend>
      {/*
        One grid cell holds, stacked: every possible explanation, invisible,
        so the box keeps the height of the longest one from the start; the
        options; and the explanation shown. Switching between them moves
        nothing on the page.
      */}
      <div className="clear-left grid pt-1.5">
        {question.options.map((option) => (
          <div
            key={option.id}
            aria-hidden="true"
            className="invisible col-start-1 row-start-1"
          >
            <Explanation question={question} optionId={option.id} />
          </div>
        ))}
        {/*
          Buttons, not radio buttons: one click answers. With radio buttons
          the arrow keys select as they move, so a keyboard user would answer
          by accident.
        */}
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
                disabled={!hydrated || explained !== null}
                onClick={() => choose(option.id)}
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
            <Explanation
              question={question}
              optionId={explained}
              onShowOptions={showOptions}
            />
          )}
        </output>
      </div>
    </fieldset>
  );
}

/**
 * The verdict, the correct option when this one is wrong, why, and the way
 * back to the options. Without `onShowOptions` it only takes up the room it
 * needs.
 */
function Explanation({
  question,
  optionId,
  onShowOptions,
}: {
  question: Question;
  optionId: string;
  onShowOptions?: () => void;
}) {
  const text = questionText(question.id);
  const correctOption = question.options.find(
    ({ misconception }) => misconception === null,
  );
  const correct = grade(question.id, optionId).status === "correct";
  const backClasses =
    "shrink-0 rounded-lg text-accent text-small underline-offset-4 hover:underline";
  return (
    <span className="block px-2 py-1 text-small">
      <span className="block">
        <strong className="font-medium text-strong">
          {correct ? ui.correct : ui.wrong}
        </strong>
        {!correct && correctOption !== undefined && (
          <> {ui.correctAnswer(text.option(correctOption.id).label)}</>
        )}
      </span>
      <span className="mt-1 block">{text.option(optionId).feedback}</span>
      <span className="mt-1 flex justify-end">
        {onShowOptions === undefined ? (
          <span className={backClasses}>{ui.showOptions}</span>
        ) : (
          <button type="button" onClick={onShowOptions} className={backClasses}>
            {ui.showOptions}
          </button>
        )}
      </span>
    </span>
  );
}
