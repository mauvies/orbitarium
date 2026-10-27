// Spec 05, "Testing without the real model". Records the tutor's answers
// from the real model, through the real route, as the E2E tests replay them:
// a plain answer, and for each tool its call and the answer that follows its
// result. Needs a running server with a key (`pnpm start`, with
// GOOGLE_GENERATIVE_AI_API_KEY in .env.local); spends about five requests of
// the free tier.
import { mkdir, writeFile } from "node:fs/promises";
import {
  CONTEXT,
  createTutorClient,
  learner,
  messageOf,
  runTool,
} from "./tutor-client.mjs";

const BASE_URL = process.argv[2] ?? "http://localhost:3000";
const FIXTURES = new URL("../e2e/fixtures/tutor/", import.meta.url);
const { post } = createTutorClient(BASE_URL);

/** Records a tool's call, gives it its result, and records the answer. */
async function recordTool(name, tool, question) {
  const asked = learner("q1", question);
  const { sse: call } = await post([asked]);
  const answer = await messageOf(call);
  const part = answer.parts.find(({ type }) => type === `tool-${tool}`);
  if (part === undefined) {
    throw new Error(`the model did not call ${tool} for "${question}"`);
  }
  const { output, context } = runTool(CONTEXT, tool, part.input);
  const withResult = {
    ...answer,
    id: "a1",
    parts: answer.parts.map((each) =>
      each === part ? { ...part, state: "output-available", output } : each,
    ),
  };
  const { sse: continuation } = await post([asked, withResult], context);
  return { [`${name}-call`]: call, [`${name}-continuation`]: continuation };
}

const recordings = {
  answer: (await post([learner("q1", "¿Por qué no cae la Luna?")])).sse,
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
