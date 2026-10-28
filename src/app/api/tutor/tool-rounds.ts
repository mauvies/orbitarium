import { isToolUIPart, type UIMessage } from "ai";

// Spec 05, Decision 7: from the third call on, the model must answer in text.
export const MAX_TOOL_CALLS = 3;

/**
 * The tool calls in the tutor's answer to the learner's last message. Each
 * resend after a tool result counts the same answer again, so a model that
 * keeps calling tools is stopped here.
 */
export function toolCallsSinceLearnerMessage(
  messages: readonly UIMessage[],
): number {
  const lastLearnerMessage = messages.findLastIndex(
    ({ role }) => role === "user",
  );

  return messages
    .slice(lastLearnerMessage + 1)
    .flatMap(({ parts }) => parts)
    .filter(isToolUIPart).length;
}
