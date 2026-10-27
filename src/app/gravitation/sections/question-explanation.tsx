import { es } from "@/content/es";
import { grade, type Question, questionText } from "@/lib/lesson/questions";

const ui = es.gravitation.question;

/**
 * The verdict, the correct option when this one is wrong, why, and the way
 * back to the options. Without `onShowOptions` it only takes up the room it
 * needs.
 */
export function QuestionExplanation({
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
