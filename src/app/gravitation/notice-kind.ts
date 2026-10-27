import { parseErrorCode, type TutorErrorCode } from "@/lib/tutor/error-codes";
import { isConversationTooLong } from "@/lib/tutor/limits";

export type Availability = "checking" | "available" | "not-set" | "failed";

export type NoticeKind = TutorErrorCode | "not-set" | "checking";

export type NoticeSituation = {
  readonly availability: Availability;
  readonly errorMessage: string | undefined;
  readonly messageCount: number;
};

/**
 * What the panel tells the learner under the conversation, if anything: the
 * tutor's setup first, then a failed request, then the cap on the
 * conversation, which the panel checks before sending (spec 05, Decisions 10
 * and 12).
 */
export function noticeKind({
  availability,
  errorMessage,
  messageCount,
}: NoticeSituation): NoticeKind | null {
  switch (availability) {
    case "not-set":
      return "not-set";
    case "failed":
      return "unavailable";
    case "checking":
      return "checking";
    case "available":
      break;
  }
  if (errorMessage !== undefined) {
    return parseErrorCode(errorMessage);
  }
  return isConversationTooLong(messageCount + 1) ? "too-long" : null;
}
