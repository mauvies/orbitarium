import type { UIMessage } from "ai";
import { describe, expect, it } from "vitest";
import { MAX_TOOL_CALLS, toolCallsSinceLearnerMessage } from "./tool-rounds";

function learner(id: string, text: string): UIMessage {
  return { id, role: "user", parts: [{ type: "text", text }] };
}

/** A tutor's answer that launched the cannon `launches` times. */
function tutorLaunching(id: string, launches: number): UIMessage {
  return {
    id,
    role: "assistant",
    parts: Array.from({ length: launches }, (_, i) => ({
      type: "tool-launchCannon" as const,
      toolCallId: `${id}-${i}`,
      state: "output-available" as const,
      input: { speedKmPerSecond: 8 },
      output: { status: "launched" },
    })),
  };
}

// Spec 05, Decision 7 and T5.
describe("toolCallsSinceLearnerMessage", () => {
  it("is zero right after the learner writes", () => {
    expect(
      toolCallsSinceLearnerMessage([learner("1", "Dispara a 8 km/s")]),
    ).toBe(0);
  });

  it("counts the tool calls of the tutor's answer in progress", () => {
    expect(
      toolCallsSinceLearnerMessage([
        learner("1", "Compara tres velocidades"),
        tutorLaunching("2", 2),
      ]),
    ).toBe(2);
  });

  it("does not count the calls before the learner's last message", () => {
    expect(
      toolCallsSinceLearnerMessage([
        learner("1", "Dispara tres veces"),
        tutorLaunching("2", MAX_TOOL_CALLS),
        learner("3", "Y ahora una más"),
      ]),
    ).toBe(0);
  });
});
