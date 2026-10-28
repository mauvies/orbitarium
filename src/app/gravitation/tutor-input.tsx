import { type FormEvent, type KeyboardEvent, useEffect, useState } from "react";
import { es } from "@/content/es";
import { MAX_LEARNER_MESSAGE_CHARACTERS } from "@/lib/tutor/limits";
import { useTutorPanel } from "./lesson-provider";
import { TUTOR_INPUT_ID } from "./tutor-ids";

const { tutor } = es.gravitation;

interface Props {
  waiting: boolean;
  unavailable: boolean;
  onSend: (text: string) => void;
}

export function TutorInput({ waiting, unavailable, onSend }: Props) {
  const [draft, setDraft] = useState({ text: "", suggested: false });

  const { suggestion } = useTutorPanel();

  const { text } = draft;

  function send(): void {
    const message = text.trim();

    if (waiting || unavailable || message === "") {
      return;
    }

    onSend(message);
    setDraft({ text: "", suggested: false });
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    send();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      send();
    }
  };

  // A suggested question is written, never sent.
  useEffect(() => {
    if (suggestion !== null) {
      setDraft((current) =>
        current.suggested || current.text.trim() === ""
          ? { text: suggestion.text, suggested: true }
          : current,
      );
    }
  }, [suggestion]);

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 flex items-end gap-2 rounded-xl border border-muted bg-surface py-1.5 pr-1.5 pl-3 has-[textarea:focus-visible]:border-strong has-[textarea:focus-visible]:outline-1 has-[textarea:focus-visible]:outline-strong has-[textarea:focus-visible]:outline-offset-0"
    >
      <label htmlFor={TUTOR_INPUT_ID} className="sr-only">
        {tutor.input}
      </label>
      <textarea
        id={TUTOR_INPUT_ID}
        value={text}
        onChange={(e) =>
          setDraft({ text: e.currentTarget.value, suggested: false })
        }
        onKeyDown={handleKeyDown}
        maxLength={MAX_LEARNER_MESSAGE_CHARACTERS}
        readOnly={unavailable}
        rows={1}
        placeholder={tutor.inputPlaceholder}
        className="field-sizing-content max-h-40 read-only:opacity-50 min-w-0 flex-1 resize-none bg-transparent py-1 text-body placeholder:text-muted focus-visible:outline-none"
      />
      <button
        type="submit"
        aria-label={tutor.send}
        disabled={waiting || unavailable}
        className="flex size-8 shrink-0 items-center justify-center rounded-[10px] text-muted hover:text-strong disabled:opacity-50"
      >
        <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4">
          <path
            d="M13 3v4.5a2 2 0 0 1-2 2H3.5M6.5 6.5 3.5 9.5l3 3"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </form>
  );
}
