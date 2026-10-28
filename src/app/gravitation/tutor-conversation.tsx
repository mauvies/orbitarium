import type { UseChatHelpers } from "@ai-sdk/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { es } from "@/content/es";
import type { TutorMessage } from "@/lib/tutor/tools";
import { finishedAnswer } from "./finished-answer";
import { type Availability, type NoticeKind, noticeKind } from "./notice-kind";
import { TutorChatMessage } from "./tutor-chat-message";
import { TutorGreeting } from "./tutor-greeting";
import { TutorInput } from "./tutor-input";
import { announcedNotice, TutorNotice } from "./tutor-notice";
import { useSlowAnswer } from "./use-slow-answer";

const { tutor } = es.gravitation;

const RETRYABLE: readonly NoticeKind[] = [
  "rate-limited",
  "daily-limit",
  "busy",
  "unavailable",
];

interface Props {
  chat: UseChatHelpers<TutorMessage>;
  availability: Availability;
  atCannon: boolean;
  retryAvailability: () => void;
}

export function TutorConversation({
  chat: { messages, status, error, sendMessage, regenerate },
  availability,
  atCannon,
  retryAvailability,
}: Props) {
  const [announcement, setAnnouncement] = useState("");
  const announced = useRef<string | null>(null);
  const list = useRef<HTMLDivElement>(null);

  const isSlow = useSlowAnswer(status);

  const isWaiting = status === "submitted" || status === "streaming";

  const kind = noticeKind({
    availability,
    errorMessage: error?.message,
    messageCount: messages.length,
  });

  const notice = kind === null ? null : announcedNotice(kind);

  // Cleared first, so the same words twice are announced twice.
  const announce = useCallback((text: string) => {
    setAnnouncement("");
    requestAnimationFrame(() => setAnnouncement(text));
  }, []);

  function retryFor(shown: NoticeKind): (() => void) | undefined {
    if (!RETRYABLE.includes(shown)) {
      return undefined;
    }

    return availability === "failed" ? retryAvailability : () => regenerate();
  }

  useEffect(() => {
    const answer = finishedAnswer(status, messages);

    if (answer === null || announced.current === answer.id) {
      return;
    }

    announced.current = answer.id;
    announce(answer.text);
  }, [status, messages, announce]);

  useEffect(() => {
    if (notice !== null) {
      announce(notice);
    }
  }, [notice, announce]);

  useEffect(() => {
    if (isSlow) {
      announce(tutor.slowAnswer);
    }
  }, [isSlow, announce]);

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
        <p className="mt-2 text-muted text-small">
          {isSlow ? tutor.slowAnswer : tutor.thinking}
        </p>
      )}
      {kind !== null && <TutorNotice kind={kind} onRetry={retryFor(kind)} />}
      <TutorInput
        waiting={isWaiting || availability === "checking"}
        unavailable={availability !== "available" || kind === "too-long"}
        onSend={(text) => sendMessage({ text })}
      />
      <output className="sr-only">{announcement}</output>
    </div>
  );
}
