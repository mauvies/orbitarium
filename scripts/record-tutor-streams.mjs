// Spec 05, "Testing without the real model". Records the tutor's answers
// from the real model, through the real route, as the E2E tests replay them:
// a plain answer, and for each tool its call and the answer that follows its
// result. Needs a running server with a key (`pnpm start`, with
// GOOGLE_GENERATIVE_AI_API_KEY in .env.local); spends about five requests of
// the free tier.
import { mkdir, writeFile } from "node:fs/promises";
import { readUIMessageStream } from "ai";

const BASE_URL = process.argv[2] ?? "http://localhost:3000";
const FIXTURES = new URL("../e2e/fixtures/tutor/", import.meta.url);

// The lesson as the E2E tests open it: nothing answered, the cannon unfired.
const CONTEXT = {
  section: "cannon",
  cannon: {
    settings: { speedKmPerSecond: 7, angleDegrees: 0, altitudeKm: 10 },
    lastLaunch: null,
  },
  profile: [
    ["two-falls", "fall-direction"],
    ["who-pulls-harder", "mutual-attraction"],
    ["twice-as-far", "inverse-square"],
    ["why-the-moon-does-not-fall", "orbit-as-falling"],
    ["twice-the-mass", "full-law"],
  ].map(([question, concept]) => ({
    question,
    concept,
    result: { status: "unknown" },
  })),
};

// What the page's controls return for each call, as the model will read it.
const RESULTS = {
  launchCannon: (input) => ({
    status: "launched",
    speedKmPerSecond: input.speedKmPerSecond,
    angleDegrees: 0,
    altitudeKm: 10,
    outcome: "elliptical-orbit",
    clamped: [],
  }),
  goToSection: (input) => ({ status: "moved", section: input.section }),
};

function learner(id, text) {
  return { id, role: "user", parts: [{ type: "text", text }] };
}

/** Posts the conversation and returns the stream exactly as it arrived. */
async function post(messages) {
  const response = await fetch(new URL("/api/tutor", BASE_URL), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ messages, context: CONTEXT }),
  });
  const body = await response.text();
  if (!response.ok || body.includes('"type":"error"')) {
    throw new Error(`the route answered ${response.status}: ${body}`);
  }
  return body;
}

/** The assistant message a recorded stream builds, as the page would. */
async function messageOf(sse) {
  const chunks = sse
    .split("\n")
    .filter((line) => line.startsWith("data: ") && line !== "data: [DONE]")
    .map((line) => JSON.parse(line.slice("data: ".length)));
  let message;
  for await (const snapshot of readUIMessageStream({
    stream: ReadableStream.from(chunks),
  })) {
    message = snapshot;
  }
  return message;
}

/** Records a tool's call, gives it its result, and records the answer. */
async function recordTool(name, tool, question) {
  const asked = learner("q1", question);
  const call = await post([asked]);
  const answer = await messageOf(call);
  const part = answer.parts.find(({ type }) => type === `tool-${tool}`);
  if (part === undefined) {
    throw new Error(`the model did not call ${tool} for "${question}"`);
  }
  const withResult = {
    ...answer,
    id: "a1",
    parts: answer.parts.map((each) =>
      each === part
        ? {
            ...part,
            state: "output-available",
            output: RESULTS[tool](part.input),
          }
        : each,
    ),
  };
  const continuation = await post([asked, withResult]);
  return { [`${name}-call`]: call, [`${name}-continuation`]: continuation };
}

const recordings = {
  answer: await post([learner("q1", "¿Por qué no cae la Luna?")]),
  ...(await recordTool("launch", "launchCannon", "Dispara el cañón a 8 km/s.")),
  ...(await recordTool(
    "move",
    "goToSection",
    "Llévame a la parte de la Luna.",
  )),
};

await mkdir(FIXTURES, { recursive: true });
for (const [name, sse] of Object.entries(recordings)) {
  await writeFile(new URL(`${name}.sse`, FIXTURES), sse);
  console.log(`recorded ${name}.sse`);
}
