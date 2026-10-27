import { describe, expect, it } from "vitest";
import { isConversationTooLong, MAX_CONVERSATION_MESSAGES } from "./limits";

// Spec 05, Decision 3: the route and the panel count the same way.
describe("isConversationTooLong", () => {
  it("accepts a conversation of exactly the most messages", () => {
    expect(isConversationTooLong(MAX_CONVERSATION_MESSAGES)).toBe(false);
  });

  it("refuses a conversation one message over", () => {
    expect(isConversationTooLong(MAX_CONVERSATION_MESSAGES + 1)).toBe(true);
  });
});
