"use client";

import { useState, useSyncExternalStore } from "react";
import { es } from "@/content/es";
import { useAnswerQuestion, useLessonSession } from "../lesson-provider";
import { grade, type Question, questionText } from "../questions";

const ui = es.gravitation.question;

/**
 * A single-choice check question (spec 04, Decision 5). The learner picks an
 * option and confirms it: arrow keys move between radio buttons, so choosing
 * alone must not count as answering. The first answer locks the question and
 * shows its feedback.
 */
export function CheckQuestion({ question }: { question: Question }) {
  const answered = useLessonSession().answers[question.id];
  const answer = useAnswerQuestion();
  const hydrated = useHydrated();
  const [chosen, choose] = useState<string | null>(null);
  const text = questionText(question.id);
  const locked = answered !== undefined;
  const selected = answered ?? chosen;

  return (
    <fieldset className="mt-10 max-w-[60ch] rounded-2xl border border-line bg-surface p-5">
      <legend className="px-1 font-heading font-medium text-card text-strong">
        {text.prompt}
      </legend>
      <div className="mt-2 flex flex-col gap-2">
        {question.options.map((option) => (
          <label
            key={option.id}
            className="flex items-start gap-3 rounded-[10px] px-2 py-2 has-checked:bg-surface-raised has-checked:text-strong"
          >
            {/* Disabled before the page hydrates, so a click is never lost. */}
            <input
              type="radio"
              name={question.id}
              value={option.id}
              checked={selected === option.id}
              onChange={() => choose(option.id)}
              disabled={!hydrated || locked}
              className="mt-1 size-4 shrink-0 cursor-pointer accent-accent disabled:cursor-default"
            />
            {text.option(option.id).label}
          </label>
        ))}
      </div>
      {!locked && (
        <button
          type="button"
          disabled={chosen === null}
          onClick={() => chosen !== null && answer(question.id, chosen)}
          className="mt-4 rounded-[10px] bg-accent px-4 py-2 text-bg-bottom disabled:opacity-50"
        >
          {ui.answer}
        </button>
      )}
      {/* Always present, even empty: a live region must exist before its text arrives to be announced. */}
      <output className="block">
        {locked && (
          <span className="mt-4 block">
            <strong className="font-medium text-strong">
              {grade(question.id, answered).status === "correct"
                ? ui.correct
                : ui.wrong}
            </strong>{" "}
            {text.option(answered).feedback}
          </span>
        )}
      </output>
    </fieldset>
  );
}

function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
}

function subscribeToNothing(): () => void {
  return () => {};
}
