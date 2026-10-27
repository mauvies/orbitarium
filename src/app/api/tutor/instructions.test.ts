import { describe, expect, it } from "vitest";
import { CANNON_PRESET_IDS } from "@/cannon";
import { es } from "@/content/es";
import { learnerProfile } from "@/lib/lesson/learner-profile";
import { QUESTIONS, questionText } from "@/lib/lesson/questions";
import { SECTION_IDS } from "@/lib/lesson/section-ids";
import type { TutorContext } from "@/lib/tutor/context";
import { tutorInstructions } from "./instructions";

const { sections, cannon } = es.gravitation;

const NEWTONS_MOUNTAIN = {
  speedKmPerSecond: 7,
  angleDegrees: 45,
  altitudeKm: 10,
};

// One question right, one wrong, the rest unanswered.
const AT_THE_CANNON_AFTER_A_LAUNCH: TutorContext = {
  section: "cannon",
  cannon: {
    settings: { speedKmPerSecond: 8, angleDegrees: 0, altitudeKm: 10 },
    lastLaunch: { ...NEWTONS_MOUNTAIN, outcome: "ballistic" },
  },
  profile: learnerProfile({
    "two-falls": "centre",
    "who-pulls-harder": "earth",
  }),
};

const READING_THE_START: TutorContext = {
  section: "falling",
  cannon: { settings: NEWTONS_MOUNTAIN, lastLaunch: null },
  profile: learnerProfile({}),
};

const instructions = tutorInstructions(AT_THE_CANNON_AFTER_A_LAUNCH);

// Spec 05, Decision 5 and T3: what the model is told about the lesson.
describe("tutorInstructions: the lesson", () => {
  it("names every part with its id and title", () => {
    for (const section of SECTION_IDS) {
      expect(instructions).toContain(
        `${section}: «${sections[section].title}»`,
      );
    }
  });

  it("names every question with its correct option", () => {
    for (const question of QUESTIONS) {
      const text = questionText(question.id);
      const correct = question.options.find(
        ({ misconception }) => misconception === null,
      );
      if (correct === undefined) {
        throw new Error(`${question.id} has no correct option`);
      }
      expect(instructions).toContain(text.prompt);
      expect(instructions).toContain(
        `«${text.option(correct.id).label}» (correct)`,
      );
    }
  });

  it("states the cannon's limits", () => {
    expect(instructions).toContain("speed from 0 to 15 km/s");
    expect(instructions).toContain("angle from 0 to 90°");
    expect(instructions).toContain("height from 10 to 2000 km");
  });

  it("names the presets with their settings", () => {
    for (const preset of CANNON_PRESET_IDS) {
      expect(instructions).toContain(`«${cannon.presetLabels[preset]}»`);
    }
    expect(instructions).toContain(
      "«Elipse muy alargada»: 9.6 km/s, 0°, 10 km",
    );
  });
});

describe("tutorInstructions: how to answer", () => {
  it("asks for Spanish and plain text without Markdown", () => {
    expect(instructions).toContain("Always answer in Spanish");
    expect(instructions).toContain("Plain text only");
    expect(instructions).toContain("no Markdown");
  });

  it("states the accuracy rules of the design note", () => {
    expect(instructions).toContain("never say that one pulls harder");
    expect(instructions).toContain("a story Newton told late in life");
    expect(instructions).toContain("it falls about 4.9 m");
    expect(instructions).toContain("say «en el primer segundo»");
    expect(instructions).not.toContain("por segundo");
    expect(instructions).toContain("from the Earth's centre");
  });

  it("says to stay on the lesson's subject", () => {
    expect(instructions).toContain("Stay on the lesson's subject");
  });
});

describe("tutorInstructions: the context", () => {
  it("names the part at the top", () => {
    expect(instructions).toContain(
      "Part at the top of the learner's screen: cannon",
    );
  });

  it("gives the cannon's settings and its last launch", () => {
    expect(instructions).toContain("Cannon settings: 8 km/s, 0°, 10 km.");
    expect(instructions).toContain(
      "Last launch: 7 km/s, 45°, 10 km, outcome ballistic.",
    );
  });

  it("says when the cannon has not been fired", () => {
    expect(tutorInstructions(READING_THE_START)).toContain(
      "Last launch: none yet.",
    );
  });

  it("lists each question as correct, a misconception or unanswered", () => {
    expect(instructions).toContain("- two-falls (fall-direction): correct");
    expect(instructions).toContain(
      "- who-pulls-harder (mutual-attraction): wrong, misconception larger-body-pulls-harder",
    );
    expect(instructions).toContain(
      "- twice-as-far (inverse-square): not answered yet",
    );
  });

  it("the same context gives the same instructions", () => {
    expect(tutorInstructions(AT_THE_CANNON_AFTER_A_LAUNCH)).toBe(instructions);
  });
});
