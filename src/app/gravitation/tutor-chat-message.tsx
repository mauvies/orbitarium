import { es } from "@/content/es";
import type { TutorMessage } from "@/lib/tutor/tools";
import { LEARNER_BUBBLE, TUTOR_BUBBLE } from "./chat-bubbles";
import { messageBlocks } from "./message-blocks";

const { tutor } = es.gravitation;

interface Props {
  message: TutorMessage;
}

/**
 * One message of the conversation, as plain text with its line breaks, and
 * the tutor's actions as quieter lines (spec 05, Decisions 8 and 11). Who
 * speaks is said to screen readers and shown by the message's side.
 */
export function TutorChatMessage({ message }: Props) {
  const isFromLearner = message.role === "user";

  return (
    <div className={isFromLearner ? LEARNER_BUBBLE : TUTOR_BUBBLE}>
      <span className="sr-only">
        {isFromLearner ? tutor.learner : tutor.tutor}
      </span>
      {messageBlocks(message).map(({ key, kind, text }) => (
        <p
          key={key}
          className={kind === "text" ? "whitespace-pre-line" : "text-muted"}
        >
          {text}
        </p>
      ))}
    </div>
  );
}
