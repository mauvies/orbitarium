import { useState } from "react";
import { es } from "@/content/es";
import { MAX_LEARNER_MESSAGE_CHARACTERS } from "@/lib/tutor/limits";
import { TUTOR_INPUT_ID } from "./tutor-ids";

const { tutor } = es.gravitation;

/**
 * Where the learner writes: one field that grows with the text, with
 * «Enviar» inside it (visual style, "Tutor's panel"). Enter sends and
 * Shift+Enter adds a line; Enter while composing an accent with a dead key
 * does neither. Nothing is sent while an answer is on its way (spec 05,
 * Decision 11).
 */
export function TutorInput({
  waiting,
  onSend,
}: {
  waiting: boolean;
  onSend: (text: string) => void;
}) {
  const [text, setText] = useState("");

  function send(): void {
    const message = text.trim();
    if (waiting || message === "") {
      return;
    }
    onSend(message);
    setText("");
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        send();
      }}
      // While the text area has focus the field's border turns light and
      // doubles to 2 px (border plus outline), instead of the accent ring.
      className="mt-3 flex items-end gap-2 rounded-xl border border-muted bg-surface py-1.5 pr-1.5 pl-3 has-[textarea:focus-visible]:border-strong has-[textarea:focus-visible]:outline-1 has-[textarea:focus-visible]:outline-strong has-[textarea:focus-visible]:outline-offset-0"
    >
      <label htmlFor={TUTOR_INPUT_ID} className="sr-only">
        {tutor.input}
      </label>
      <textarea
        id={TUTOR_INPUT_ID}
        value={text}
        onChange={(event) => setText(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (
            event.key === "Enter" &&
            !event.shiftKey &&
            !event.nativeEvent.isComposing
          ) {
            event.preventDefault();
            send();
          }
        }}
        maxLength={MAX_LEARNER_MESSAGE_CHARACTERS}
        rows={1}
        placeholder={tutor.inputPlaceholder}
        className="field-sizing-content max-h-40 min-w-0 flex-1 resize-none bg-transparent py-1 text-body placeholder:text-muted focus-visible:outline-none"
      />
      <button
        type="submit"
        aria-label={tutor.send}
        disabled={waiting}
        className="flex size-8 shrink-0 items-center justify-center rounded-[10px] text-muted hover:text-strong disabled:opacity-50"
      >
        {/* A return arrow, as the Enter key that also sends. */}
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
