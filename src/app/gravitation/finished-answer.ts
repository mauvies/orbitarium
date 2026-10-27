import type { ChatStatus } from "ai";
import type { TutorMessage } from "@/lib/tutor/tools";

/**
 * The tutor's last message, once it has ended, as one text to announce in
 * full; nothing while it streams, so its words are never read one by one
 * (spec 05, Decision 11).
 */
export function finishedAnswer(
  status: ChatStatus,
  messages: readonly TutorMessage[],
): { readonly id: string; readonly text: string } | null {
  const last = messages.at(-1);
  if (status !== "ready" || last === undefined || last.role !== "assistant") {
    return null;
  }
  const text = last.parts
    .flatMap((part) => (part.type === "text" ? [part.text] : []))
    .join("");
  return text === "" ? null : { id: last.id, text };
}
