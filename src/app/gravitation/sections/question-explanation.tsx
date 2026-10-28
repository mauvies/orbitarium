import { es } from "@/content/es";
import { grade, type Question, questionText } from "@/lib/lesson/questions";

const ui = es.gravitation.question;

type Actions = {
  readonly onShowOptions: () => void;
  readonly onAskTutor: () => void;
};

interface Props {
  question: Question;
  optionId: string;
  actions?: Actions;
}

export function QuestionExplanation({ question, optionId, actions }: Props) {
  const text = questionText(question.id);
  const correctOption = question.options.find(
    ({ misconception }) => misconception === null,
  );
  const correct = grade(question.id, optionId).status === "correct";
  const linkClasses =
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
      <span className="mt-3 flex flex-wrap justify-end gap-x-4">
        {actions === undefined ? (
          <>
            <span className={linkClasses}>{ui.askTutor}</span>
            <span className={linkClasses}>{ui.showOptions}</span>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={actions.onAskTutor}
              className={linkClasses}
            >
              {ui.askTutor}
            </button>
            <button
              type="button"
              onClick={actions.onShowOptions}
              className={linkClasses}
            >
              {ui.showOptions}
            </button>
          </>
        )}
      </span>
    </span>
  );
}
