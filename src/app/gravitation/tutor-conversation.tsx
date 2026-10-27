import type { UseChatHelpers } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import { es } from "@/content/es";
import type { TutorMessage } from "@/lib/tutor/tools";
import { finishedAnswer } from "./finished-answer";
import { TutorChatMessage } from "./tutor-chat-message";
import { TutorGreeting } from "./tutor-greeting";
import { TutorInput } from "./tutor-input";

const { tutor } = es.gravitation;

/**
 * The conversation inside the panel (spec 05, Decision 11). The list of
 * messages is not a live region: each finished answer is announced once, in
 * full, through a hidden region of its own, apart from the one that
 * announces the tutor's moves.
 */
export function TutorConversation({
  chat: { messages, status, sendMessage },
  atCannon,
}: {
  chat: UseChatHelpers<TutorMessage>;
  atCannon: boolean;
}) {
  const [announcement, setAnnouncement] = useState("");
  const announced = useRef<string | null>(null);
  const list = useRef<HTMLDivElement>(null);
  const waiting = status === "submitted" || status === "streaming";

  useEffect(() => {
    const answer = finishedAnswer(status, messages);
    if (answer === null || announced.current === answer.id) {
      return;
    }
    announced.current = answer.id;
    // Cleared first, so the same words in a new answer are announced too.
    setAnnouncement("");
    requestAnimationFrame(() => setAnnouncement(answer.text));
  }, [status, messages]);

  useEffect(() => {
    const element = list.current;
    if (element !== null && messages.length > 0) {
      element.scrollTop = element.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="mt-3 flex min-h-0 flex-1 flex-col">
      <section
        ref={list}
        aria-label={tutor.conversation}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrolling region with nothing focusable in it must take focus, or a keyboard cannot scroll it (WCAG 2.1.1, axe's scrollable-region-focusable).
        tabIndex={0}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain"
      >
        {messages.length === 0 ? (
          <TutorGreeting atCannon={atCannon} />
        ) : (
          messages.map((message) => (
            <TutorChatMessage key={message.id} message={message} />
          ))
        )}
      </section>
      {status === "submitted" && (
        <p className="mt-2 text-muted text-small">{tutor.thinking}</p>
      )}
      <TutorInput waiting={waiting} onSend={(text) => sendMessage({ text })} />
      <output className="sr-only">{announcement}</output>
    </div>
  );
}
