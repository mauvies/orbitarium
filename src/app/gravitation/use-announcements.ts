import type { ChatStatus } from "ai";
import { useCallback, useEffect, useRef, useState } from "react";
import type { TutorMessage } from "@/lib/tutor/tools";
import { finishedAnswer } from "./finished-answer";

type Announcements = {
  /** The text of the panel's hidden polite region. */
  readonly announcement: string;
  readonly announce: (text: string) => void;
};

/**
 * What the panel's polite region reads: each finished answer once, in full,
 * and each notice as it appears; `announce` adds any other text (spec 05,
 * Decisions 10 and 11).
 */
export function useAnnouncements(
  status: ChatStatus,
  messages: readonly TutorMessage[],
  notice: string | null,
): Announcements {
  const [announcement, setAnnouncement] = useState("");
  const announced = useRef<string | null>(null);

  // Cleared first, so the same words twice are announced twice.
  const announce = useCallback((text: string) => {
    setAnnouncement("");
    requestAnimationFrame(() => setAnnouncement(text));
  }, []);

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

  return { announcement, announce };
}
