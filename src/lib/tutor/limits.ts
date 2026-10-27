// Spec 05, Decision 3: enforced by the panel's input and again by the route.
export const MAX_LEARNER_MESSAGE_CHARACTERS = 500;

export const MAX_CONVERSATION_MESSAGES = 30;

export function isConversationTooLong(messageCount: number): boolean {
  return messageCount > MAX_CONVERSATION_MESSAGES;
}
