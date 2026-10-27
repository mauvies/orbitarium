import { z } from "zod";
import {
  CANNON_OUTCOMES,
  type CannonOutcome,
  type CannonSettings,
} from "@/cannon";
import type { LearnerProfile } from "@/lib/lesson/learner-profile";
import { QUESTIONS } from "@/lib/lesson/questions";
import { SECTION_IDS, type SectionId } from "@/lib/lesson/section-ids";

/**
 * What the page tells the tutor with every message (spec 05, Decision 4):
 * the part at the top of the viewport, the cannon and the learner profile.
 */
export type TutorContext = {
  readonly section: SectionId;
  readonly cannon: {
    readonly settings: CannonSettings;
    readonly lastLaunch:
      | (CannonSettings & { readonly outcome: CannonOutcome })
      | null;
  };
  readonly profile: LearnerProfile;
};

export type ParsedTutorContext =
  | { readonly status: "valid"; readonly context: TutorContext }
  | {
      readonly status: "invalid";
      /** The field's path, such as `profile.1.result.misconception`. */
      readonly field: string;
      readonly reason: string;
    };

const QUESTION_IDS = QUESTIONS.map(({ id }) => id);
const CONCEPTS = [...new Set(QUESTIONS.map(({ concept }) => concept))];
const MISCONCEPTIONS = [
  ...new Set(
    QUESTIONS.flatMap(({ options }) =>
      options.flatMap(({ misconception }) =>
        misconception === null ? [] : [misconception],
      ),
    ),
  ),
];

// Spec 05, Decision 3: every field is an enum value or a finite number, and
// no object takes fields it does not name, so the context has no free text.
const settingsShape = {
  speedKmPerSecond: z.number(),
  angleDegrees: z.number(),
  altitudeKm: z.number(),
};

const tutorContextSchema: z.ZodType<TutorContext> = z.strictObject({
  section: z.enum(SECTION_IDS),
  cannon: z.strictObject({
    settings: z.strictObject(settingsShape),
    lastLaunch: z
      .strictObject({ ...settingsShape, outcome: z.enum(CANNON_OUTCOMES) })
      .nullable(),
  }),
  profile: z
    .array(
      z.strictObject({
        question: z.enum(QUESTION_IDS),
        concept: z.enum(CONCEPTS),
        result: z.discriminatedUnion("status", [
          z.strictObject({ status: z.literal("unknown") }),
          z.strictObject({ status: z.literal("correct") }),
          z.strictObject({
            status: z.literal("misconception"),
            misconception: z.enum(MISCONCEPTIONS),
          }),
        ]),
      }),
    )
    .max(QUESTIONS.length),
});

export function parseTutorContext(value: unknown): ParsedTutorContext {
  const result = tutorContextSchema.safeParse(value);
  if (result.success) {
    return { status: "valid", context: result.data };
  }
  const [issue] = result.error.issues;
  if (issue === undefined) {
    throw new Error("zod reported an invalid context without an issue");
  }
  const path =
    issue.code === "unrecognized_keys"
      ? [...issue.path, ...issue.keys]
      : issue.path;
  return {
    status: "invalid",
    field: path.length === 0 ? "context" : path.map(String).join("."),
    reason: issue.message,
  };
}
