// Spec 05, T13 and T14. Asks the real model, through the real route, a fixed
// set of questions, and prints what a human needs to judge the tutor: for each
// one the tool it called, the mechanical flags, and its whole answer next to
// the behaviour expected of it. It also times each request, so run against the
// deployment it measures the first token. Needs a running server with a key
// and spends about 16 requests of the free tier, one every 8 seconds:
//
//   pnpm eval:tutor [--base-url https://...]   (default http://localhost:3000)
import { answerFlags } from "./lib/answer-flags.ts";
import {
  CONTEXT,
  createTutorClient,
  learner,
  messageOf,
  RouteError,
  runTool,
} from "./tutor-client.mjs";

// The route's limit counts every request of one client: 8 a minute for those
// that start a turn (spec 05, Decision 9).
const GAP_MS = 8_000;
const RETRY_AFTER_REFUSAL_MS = 60_000;
// The route offers no tools from the third call of a turn on (Decision 7).
const MAX_TOOL_ROUNDS = 3;

function argument(name, fallback) {
  const at = process.argv.indexOf(name);
  return at === -1 ? fallback : process.argv[at + 1];
}

const BASE_URL = argument("--base-url", "http://localhost:3000");

/** The lesson's context with one question's result replaced. */
function withResult(question, result) {
  return {
    ...CONTEXT,
    profile: CONTEXT.profile.map((entry) =>
      entry.question === question ? { ...entry, result } : entry,
    ),
  };
}

const PROMPTS = [
  {
    id: "inverse-square",
    question:
      "Si la Luna estuviera al doble de distancia, ¿cómo cambiaría la fuerza?",
    expectedTool: null,
    expected: "Cuatro veces más débil, por el inverso del cuadrado.",
  },
  {
    id: "equal-forces",
    question:
      "¿Quién atrae más fuerte, la Tierra a la manzana o la manzana a la Tierra?",
    expectedTool: null,
    expected:
      "Fuerzas iguales; la manzana se mueve más por su poca masa; nunca «una atrae más».",
  },
  {
    id: "per-second",
    question: "¿Cuánto cae una manzana por segundo?",
    expectedTool: null,
    expected: "Una distancia «en un segundo», nunca «por segundo».",
  },
  {
    id: "astronauts",
    question:
      "Los astronautas flotan porque en el espacio no hay gravedad, ¿verdad?",
    expectedTool: null,
    expected: "Corrige: hay gravedad; flotan porque están en caída libre.",
  },
  {
    id: "markdown-bait",
    question:
      "Explícame la ley de Newton con una fórmula y pon lo importante en negritas.",
    expectedTool: null,
    expected: "Texto plano: sin negritas ni listas, aunque se las pida.",
  },
  {
    id: "launch",
    question: "Dispara el cañón a 8 km/s.",
    expectedTool: "launchCannon",
    expected: "Dispara y explica el resultado que devolvió, no uno inventado.",
  },
  {
    id: "set",
    question: "Pon la velocidad a 9 km/s, pero no dispares todavía.",
    expectedTool: "setCannon",
    expected: "Ajusta sin disparar, y lo dice.",
  },
  {
    id: "move",
    question: "Llévame a la parte de la Luna.",
    expectedTool: "goToSection",
    expected: "Se mueve y lo confirma en pocas palabras.",
  },
  {
    id: "clamped-launch",
    question: "Dispara el cañón a 50 km/s.",
    expectedTool: "launchCannon",
    expected: "Dice que el máximo es 15 km/s y que disparó a 15.",
  },
  {
    id: "off-topic",
    question: "¿Cuál es la capital de Francia?",
    expectedTool: null,
    expected: "Dice brevemente que solo puede ayudar con la lección.",
  },
  {
    id: "misconception",
    question: "¿y ahora qué?",
    context: withResult("who-pulls-harder", {
      status: "misconception",
      misconception: "larger-body-pulls-harder",
    }),
    expectedTool: null,
    expected:
      "Aborda la concepción errónea de quién atrae más: las fuerzas son iguales.",
  },
  {
    id: "hint-not-answer",
    question:
      "¿Cuál es la respuesta correcta de la pregunta de las dos caídas?",
    expectedTool: null,
    expected: "Da una pista, no la respuesta («hacia el centro de la Tierra»).",
  },
];

const client = createTutorClient(BASE_URL, { gapMs: GAP_MS });
const timings = [];

/** One request; a refusal by the route's limit is noted and retried once. */
async function request(messages, context, notes) {
  try {
    return await client.post(messages, context);
  } catch (error) {
    if (!(error instanceof RouteError) || error.status !== 429) {
      throw error;
    }
    notes.push(`refused (${error.body}), retried after 60 s`);
    await new Promise((resolve) => setTimeout(resolve, RETRY_AFTER_REFUSAL_MS));
    return client.post(messages, context);
  }
}

/** One question to the tutor, with its tool calls run and answered, as the page does. */
async function ask({ id, question, context = CONTEXT }) {
  const notes = [];
  const calls = [];
  const asked = learner(`q-${id}`, question);
  const tutorParts = [];
  let current = context;

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    const messages = [asked];
    if (tutorParts.length > 0) {
      messages.push({ id: `a-${id}`, role: "assistant", parts: tutorParts });
    }
    const { sse, firstChunkMs, firstTextMs } = await request(
      messages,
      current,
      notes,
    );
    const reply = await messageOf(sse);
    const toolParts = reply.parts.filter(({ type }) =>
      type.startsWith("tool-"),
    );
    if (round === 0) {
      timings.push(
        toolParts.length > 0
          ? { kind: "call", ms: firstChunkMs }
          : { kind: "text", ms: firstTextMs },
      );
    } else {
      timings.push({ kind: "answer", ms: firstTextMs });
    }

    for (const part of reply.parts) {
      if (!part.type.startsWith("tool-")) {
        tutorParts.push(part);
        continue;
      }
      const tool = part.type.slice("tool-".length);
      calls.push(tool);
      const result = runTool(current, tool, part.input);
      current = result.context;
      tutorParts.push({
        ...part,
        state: "output-available",
        output: result.output,
      });
    }
    if (toolParts.length === 0) {
      break;
    }
  }

  const text = tutorParts
    .filter(({ type }) => type === "text")
    .map(({ text: part }) => part)
    .join("\n");
  return { calls, text, notes };
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function cell(value) {
  return String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
}

function row(cells) {
  return `| ${cells.map(cell).join(" | ")} |`;
}

const yesNo = (flag) => (flag ? "YES" : "-");

const results = [];
const failures = [];
for (const prompt of PROMPTS) {
  console.error(`asking ${prompt.id}…`);
  try {
    const { calls, text, notes } = await ask(prompt);
    results.push({ prompt, calls, text, notes, flags: answerFlags(text) });
  } catch (error) {
    failures.push(`${prompt.id}: ${error.message}`);
  }
}

console.log(`# Tutor eval against ${BASE_URL}\n`);
console.log(
  row([
    "prompt",
    "expected tool",
    "called",
    "tool ok",
    "markdown",
    "list",
    "por segundo",
    "expected behaviour",
  ]),
);
console.log(row(Array(8).fill("---")));
for (const { prompt, calls, flags } of results) {
  const called = calls[0] ?? null;
  console.log(
    row([
      prompt.id,
      prompt.expectedTool ?? "-",
      calls.length === 0 ? "-" : calls.join(", "),
      called === prompt.expectedTool ? "ok" : "NO",
      yesNo(flags.markdown),
      yesNo(flags.list),
      yesNo(flags.perSecond),
      prompt.expected,
    ]),
  );
}

console.log("\n## Answers\n");
for (const { prompt, calls, text, notes } of results) {
  console.log(`### ${prompt.id}\n`);
  console.log(`Question: ${prompt.question}`);
  console.log(`Expected: ${prompt.expected}`);
  if (calls.length > 0) {
    console.log(`Tool calls: ${calls.join(", ")}`);
  }
  for (const note of notes) {
    console.log(`Note: ${note}`);
  }
  console.log(`\n${text}\n`);
}

console.log("## First token\n");
console.log(
  `First request, apart because it may include a cold start: ${Math.round(timings[0]?.ms ?? 0)} ms (${timings[0]?.kind}).\n`,
);
console.log(row(["kind", "n", "min ms", "median ms", "max ms"]));
console.log(row(Array(5).fill("---")));
for (const [kind, what] of [
  ["text", "a text answer, to its first text"],
  ["call", "a tool's call, to its first chunk"],
  ["answer", "the answer after a tool, to its first text"],
]) {
  const values = timings
    .slice(1)
    .filter((timing) => timing.kind === kind && timing.ms !== null)
    .map(({ ms }) => ms);
  console.log(
    values.length === 0
      ? row([`${kind}: ${what}`, 0, "-", "-", "-"])
      : row([
          `${kind}: ${what}`,
          values.length,
          Math.round(Math.min(...values)),
          Math.round(median(values)),
          Math.round(Math.max(...values)),
        ]),
  );
}

if (failures.length > 0) {
  console.error(`\n${failures.length} question(s) failed:`);
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exitCode = 1;
}
