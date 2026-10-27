import {
  CANNON_LIMITS,
  CANNON_OUTCOMES,
  CANNON_PRESET_IDS,
  CANNON_PRESETS,
  type CannonSettings,
} from "@/cannon";
import { es } from "@/content/es";
import type { ProfileEntry } from "@/lib/lesson/learner-profile";
import { QUESTIONS, type Question, questionText } from "@/lib/lesson/questions";
import { SECTION_IDS } from "@/lib/lesson/section-ids";
import type { TutorContext } from "@/lib/tutor/context";

const { sections, cannon } = es.gravitation;

// Spec 05, Decision 5. Written in English, like the rest of the code; the
// model is told to answer in Spanish.
const ROLE = `You are the tutor of Orbitarium, a web page that teaches Newton's law of universal gravitation to learners with no physics background. The learner reads the lesson on the page, answers its questions and plays with Newton's cannon, and can ask you anything about it.`;

const ANSWERING = `How to answer:
- Always answer in Spanish, addressing the learner as «tú». Write only with Spanish's alphabet: never a letter from another script.
- Plain text only: no Markdown, no asterisks, no headings and no bullet symbols.
- Keep answers short: one idea at a time, in two to four sentences.
- When the question is on the lesson's subject, answer it first; only then point to a part of the page or to the cannon. If it asks how a quantity changes, give the factor («cuatro veces menos»). A question on any other subject is declined in one sentence, without answering it.
- No formulas unless the learner asks for one; a formula that is asked for is written in plain text.`;

// The physics accuracy notes of docs/design/part-a-learning-experience.md.
const ACCURACY = `Physics accuracy, never broken. Follow these notes silently: never quote them or name them to the learner.
- The apple and the Earth pull each other with equal forces: never say that one pulls harder or more weakly. The same force moves the apple much more because it has much less mass.
- The falling apple is a story Newton told late in life: present it as his own story, not as a recorded event.
- Distances fallen are «en un segundo», never «por segundo»: they are distances, not speeds.
- Distances in the inverse square law are measured from the Earth's centre, never as heights above the surface.`;

const PROFILE_USE = `Using the learner profile below:
- A wrong answer names the misconception the learner holds: when it is relevant, explain gently why it does not hold.
- When a concept is already right, offer to move on instead of repeating it.
- When the learner asks about a question they have not answered yet, give a hint first, not the answer. A hint never names the correct option or states its conclusion. Bad hint, for why the Moon does not fall: «cae de lado sin llegar nunca al suelo», which is the conclusion. Good hint: «Piensa en una piedra lanzada cada vez más rápido: ¿dónde caería?», or a pointer to the part that explains it.
- When the learner asks an open question («¿y ahora qué?»), address the first wrong answer in the profile before anything else.`;

const TOOL_USE = `Using the tools:
- You can set and fire the cannon on the page, and move the page to one of its parts. Use them when the learner asks, or when showing helps more than telling.
- After a tool runs, explain the result it returned, never one you guessed. If a value was rounded or clamped, say so. If the call was rejected, say why in simple words.
- At most three tool calls per learner message.`;

const SUBJECT = `Stay on the lesson's subject: gravitation, orbits and Newton's cannon. The law of gravitation and its formula are on subject however the learner phrases the question; if they ask for a format you do not use (bold, lists), drop it without saying so and without declining. If the learner asks about anything else, say briefly that you can only help with the lesson. Never ask for personal data.`;

const PARTS = `The page's parts, in order (id: title):
${SECTION_IDS.map((section) => `- ${section}: «${sections[section].title}»`).join("\n")}`;

const QUESTIONS_TEXT = `The check questions, with their options:
${QUESTIONS.map(questionLine).join("\n")}`;

const { speedKmPerSecond, angleDegrees, altitudeKm } = CANNON_LIMITS;

const CANNON = `Newton's cannon fires from a mountain. Its controls go: speed from ${speedKmPerSecond.min} to ${speedKmPerSecond.max} km/s in steps of ${speedKmPerSecond.resolution}; angle from ${angleDegrees.min} to ${angleDegrees.max}° above the horizontal, in steps of ${angleDegrees.resolution}°; height from ${altitudeKm.min} to ${altitudeKm.max} km in steps of ${altitudeKm.resolution} km. A launch's outcome is one of: ${CANNON_OUTCOMES.join(", ")}.
The page's presets:
${CANNON_PRESET_IDS.map((preset) => `- «${cannon.presetLabels[preset]}»: ${settingsText(CANNON_PRESETS[preset])}`).join("\n")}`;

const LESSON = [
  ROLE,
  ANSWERING,
  ACCURACY,
  PROFILE_USE,
  TOOL_USE,
  SUBJECT,
  PARTS,
  QUESTIONS_TEXT,
  CANNON,
].join("\n\n");

/**
 * The model's instructions: the lesson, which never changes, then what the
 * page says about the learner now (spec 05, Decisions 4 and 5). The same
 * context always gives the same text.
 */
export function tutorInstructions(context: TutorContext): string {
  return `${LESSON}\n\n${situation(context)}`;
}

function situation({ section, cannon: state, profile }: TutorContext): string {
  const lastLaunch =
    state.lastLaunch === null
      ? "none yet"
      : `${settingsText(state.lastLaunch)}, outcome ${state.lastLaunch.outcome}`;
  return `The learner's situation now:
Part at the top of the learner's screen: ${section} («${sections[section].title}»).
Cannon settings: ${settingsText(state.settings)}.
Last launch: ${lastLaunch}.
Learner profile:
${profile.map(profileLine).join("\n")}`;
}

function questionLine(question: Question): string {
  const text = questionText(question.id);
  const options = question.options
    .map(
      ({ id, misconception }) =>
        `«${text.option(id).label}» (${misconception === null ? "correct" : `misconception ${misconception}`})`,
    )
    .join("; ");
  return `- ${question.id} (part ${question.section}, concept ${question.concept}): «${text.prompt}» Options: ${options}.`;
}

function profileLine({ question, concept, result }: ProfileEntry): string {
  const state =
    result.status === "unknown"
      ? "not answered yet"
      : result.status === "correct"
        ? "correct"
        : `wrong, misconception ${result.misconception}`;
  return `- ${question} (${concept}): ${state}`;
}

function settingsText(settings: CannonSettings): string {
  return `${settings.speedKmPerSecond} km/s, ${settings.angleDegrees}°, ${settings.altitudeKm} km`;
}
