// Spec 05, Decision 3: enforced by the panel's input and again by the route.
export const MAX_LEARNER_MESSAGE_CHARACTERS = 500;

export const MAX_CONVERSATION_MESSAGES = 30;

// Spec 05, Decisions 2 and 11: how long the route waits for the model to
// start before asking the fallback, and the panel before saying it is slow.
export const SLOW_ANSWER_MS = 8_000;

export function isConversationTooLong(messageCount: number): boolean {
  return messageCount > MAX_CONVERSATION_MESSAGES;
}
