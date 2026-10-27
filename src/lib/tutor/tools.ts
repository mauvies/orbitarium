import { type InferUITools, jsonSchema, tool, type UIMessage } from "ai";
import type { Applied, CannonOutcome, CannonRequest } from "@/cannon";
import { SECTION_IDS, type SectionId } from "@/lib/lesson/section-ids";

/**
 * A tool's input as the model sends it. The schemas tell the model the types,
 * but the SDK does not check them (no `validate`), so a malformed call still
 * reaches the page, where the lesson's controls reject it naming the field,
 * and the model replies (spec 05, Decision 6). `CannonRequest` already types
 * its values as `unknown` for this reason.
 */
export type SectionToolInput = { readonly section?: unknown };

/** A rejection by the lesson's controls; `reason` is for the model, not for the learner. */
export type ToolRejection = {
  readonly status: "rejected";
  readonly field: string;
  readonly reason: string;
};

// What each tool returns: the lesson controls' own results (spec 04,
// Decision 12), which must stay assignable to these.
export type SetCannonOutput =
  | ({ readonly status: "set" } & Applied)
  | ToolRejection;

export type LaunchCannonOutput =
  | ({ readonly status: "launched"; readonly outcome: CannonOutcome } & Applied)
  | ToolRejection;

export type GoToSectionOutput =
  | { readonly status: "moved"; readonly section: SectionId }
  | ToolRejection;

const cannonInput = jsonSchema<CannonRequest>({
  type: "object",
  properties: {
    speedKmPerSecond: {
      type: "number",
      description: "Launch speed, in km/s.",
    },
    angleDegrees: {
      type: "number",
      description: "Angle above the horizontal, in degrees.",
    },
    altitudeKm: {
      type: "number",
      description: "Height of the launch point above the ground, in km.",
    },
  },
});

const sectionInput = jsonSchema<SectionToolInput>({
  type: "object",
  properties: {
    section: {
      type: "string",
      description: `One of the page's parts: ${SECTION_IDS.join(", ")}.`,
    },
  },
  required: ["section"],
});

// No `execute`: the page runs each call through the lesson's controls and
// sends back what really happened (spec 05, Decision 6).
export const tutorTools = {
  setCannon: tool({
    description:
      "Moves the cannon's controls on the page without firing. A field left out keeps its value. Returns the values applied, rounded or clamped to the limits, or a rejection naming the field.",
    inputSchema: cannonInput,
    outputSchema: jsonSchema<SetCannonOutput>({ type: "object" }),
  }),
  launchCannon: tool({
    description:
      "Applies the given values as setCannon does, then fires the cannon on the page, scrolling to it if it is out of view. Returns the values applied and the outcome the learner sees, or a rejection naming the field.",
    inputSchema: cannonInput,
    outputSchema: jsonSchema<LaunchCannonOutput>({ type: "object" }),
  }),
  goToSection: tool({
    description:
      "Scrolls the page to one of its parts. Returns the part reached, or a rejection.",
    inputSchema: sectionInput,
    outputSchema: jsonSchema<GoToSectionOutput>({ type: "object" }),
  }),
};

export type TutorMessage = UIMessage<
  never,
  never,
  InferUITools<typeof tutorTools>
>;
