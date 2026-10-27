import { describe, expect, it } from "vitest";
import type { TutorMessage } from "@/lib/tutor/tools";
import { finishedAnswer } from "./finished-answer";

const QUESTION: TutorMessage = {
  id: "q1",
  role: "user",
  parts: [{ type: "text", text: "¿Por qué no cae la Luna?" }],
};

const ANSWER: TutorMessage = {
  id: "a1",
  role: "assistant",
  parts: [
    { type: "text", text: "Sí cae, pero se mueve de lado." },
    { type: "text", text: " Por eso nunca llega al suelo." },
  ],
};

const LAUNCH_WITHOUT_TEXT: TutorMessage = {
  id: "a2",
  role: "assistant",
  parts: [
    {
      type: "tool-launchCannon",
      toolCallId: "call-1",
      state: "input-available",
      input: { speedKmPerSecond: 8 },
    },
  ],
};

// Spec 05, Decision 11 and T11: an answer is announced once it has ended,
// in full, and never word by word.
describe("finishedAnswer", () => {
  it("is the whole text of the tutor's last message once it has ended", () => {
    expect(finishedAnswer("ready", [QUESTION, ANSWER])).toEqual({
      id: "a1",
      text: "Sí cae, pero se mueve de lado. Por eso nunca llega al suelo.",
    });
  });

  it("is nothing while the answer streams", () => {
    expect(finishedAnswer("streaming", [QUESTION, ANSWER])).toBeNull();
  });

  it("is nothing while the request waits", () => {
    expect(finishedAnswer("submitted", [QUESTION])).toBeNull();
  });

  it("is nothing when the tutor's message has only a tool call", () => {
    expect(finishedAnswer("ready", [QUESTION, LAUNCH_WITHOUT_TEXT])).toBeNull();
  });

  it("is nothing before the tutor has answered", () => {
    expect(finishedAnswer("ready", [QUESTION])).toBeNull();
    expect(finishedAnswer("ready", [])).toBeNull();
  });
});
