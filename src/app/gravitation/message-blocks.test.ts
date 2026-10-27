import { describe, expect, it } from "vitest";
import type { TutorMessage } from "@/lib/tutor/tools";
import { messageBlocks } from "./message-blocks";

const LAUNCHED = {
  status: "launched",
  speedKmPerSecond: 8,
  angleDegrees: 0,
  altitudeKm: 10,
  outcome: "elliptical-orbit",
  clamped: [],
} as const;

// Spec 05, Decisions 8 and 11: a message shows as its text, in plain text,
// and a line for each action the tutor finished.
describe("messageBlocks", () => {
  it("joins a message's text into one block", () => {
    const message: TutorMessage = {
      id: "a1",
      role: "assistant",
      parts: [
        { type: "text", text: "Sí cae," },
        { type: "text", text: " pero de lado." },
      ],
    };

    expect(messageBlocks(message)).toEqual([
      { key: "a1-text-start", kind: "text", text: "Sí cae, pero de lado." },
    ]);
  });

  it("puts each finished action in order with the text around it", () => {
    const message: TutorMessage = {
      id: "a1",
      role: "assistant",
      parts: [
        {
          type: "tool-launchCannon",
          toolCallId: "call-1",
          state: "output-available",
          input: { speedKmPerSecond: 8 },
          output: LAUNCHED,
        },
        { type: "text", text: "Mira: vuelve al punto de partida." },
      ],
    };

    expect(messageBlocks(message)).toEqual([
      {
        key: "call-1",
        kind: "action",
        text: "Disparo el cañón a 8,00 km/s, 0° y 10 km: órbita elíptica.",
      },
      {
        key: "a1-text-call-1",
        kind: "text",
        text: "Mira: vuelve al punto de partida.",
      },
    ]);
  });

  it("shows no line for an action still under way", () => {
    const message: TutorMessage = {
      id: "a1",
      role: "assistant",
      parts: [
        {
          type: "tool-goToSection",
          toolCallId: "call-1",
          state: "input-available",
          input: { section: "moon" },
        },
      ],
    };

    expect(messageBlocks(message)).toEqual([]);
  });

  it("leaves out parts that are not text or actions", () => {
    const message: TutorMessage = {
      id: "a1",
      role: "assistant",
      parts: [{ type: "step-start" }, { type: "text", text: "Hola." }],
    };

    expect(messageBlocks(message)).toEqual([
      { key: "a1-text-start", kind: "text", text: "Hola." },
    ]);
  });
});
