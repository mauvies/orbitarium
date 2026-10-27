// What `record-tutor-streams.mjs` and `eval-tutor.mjs` share: the lesson's
// context, a stand-in for the page's controls, and a client for the route.
// Both post to a running server, so they test the real route (spec 05, "File
// layout"). The `.ts` import needs Node's type stripping, and its package
// warning is silenced by the scripts in package.json.
import { readUIMessageStream } from "ai";
import { SECTION_IDS } from "../src/lib/lesson/section-ids.ts";

// The lesson as the E2E tests open it: nothing answered, the cannon unfired.
export const CONTEXT = {
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

// The cannon's fields as the page's controls limit them (spec 04, Decision 8).
const CANNON_LIMITS = {
  speedKmPerSecond: { min: 0, max: 15, resolution: 0.01 },
  angleDegrees: { min: 0, max: 90, resolution: 1 },
  altitudeKm: { min: 10, max: 2_000, resolution: 10 },
};

/**
 * What the page's controls would answer to a tool call, and the context the
 * page would send next, so the continuation after a result carries it as the
 * page does (spec 05, Decision 4). The outcome is a rough stand-in for the
 * engine's, enough for the model to have something true to explain.
 */
export function runTool(context, name, input) {
  switch (name) {
    case "setCannon":
    case "launchCannon":
      return runCannonTool(context, name, input);
    case "goToSection":
      return runGoToSection(context, input);
    default:
      throw new Error(`no stand-in for the tool ${name}`);
  }
}

function runCannonTool(context, name, input) {
  const clamped = [];
  const settings = { ...context.cannon.settings };
  for (const [field, limits] of Object.entries(CANNON_LIMITS)) {
    const value = input[field];
    if (value === undefined) {
      continue;
    }
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return {
        output: {
          status: "rejected",
          field,
          reason: `${field} must be a finite number`,
        },
        context,
      };
    }
    const inRange = Math.min(Math.max(value, limits.min), limits.max);
    if (inRange !== value) {
      clamped.push(field);
    }
    settings[field] = Number(
      (Math.round(inRange / limits.resolution) * limits.resolution).toFixed(2),
    );
  }
  if (name === "setCannon") {
    return {
      output: { status: "set", ...settings, clamped },
      context: { ...context, cannon: { ...context.cannon, settings } },
    };
  }
  const outcome = outcomeOf(settings.speedKmPerSecond);
  return {
    output: { status: "launched", outcome, ...settings, clamped },
    context: {
      ...context,
      cannon: { settings, lastLaunch: { ...settings, outcome } },
    },
  };
}

function outcomeOf(speedKmPerSecond) {
  if (speedKmPerSecond >= 11.2) {
    return "escape";
  }
  if (speedKmPerSecond < 7) {
    return "ballistic";
  }
  return speedKmPerSecond >= 7.85 && speedKmPerSecond <= 7.95
    ? "circular-orbit"
    : "elliptical-orbit";
}

function runGoToSection(context, { section }) {
  if (!SECTION_IDS.includes(section)) {
    return {
      output: {
        status: "rejected",
        field: "section",
        reason: `section must be one of ${SECTION_IDS.join(", ")}`,
      },
      context,
    };
  }
  return {
    output: { status: "moved", section },
    context: { ...context, section },
  };
}

/** The route refused the request, or failed before it streamed. */
export class RouteError extends Error {
  constructor(status, body) {
    super(`the route answered ${status}: ${body}`);
    this.status = status;
    this.body = body;
  }
}

const SSE_DATA = "data: ";
const CONTENT_CHUNKS = ["text-delta", "tool-input-start"];

/**
 * A client for `/api/tutor`. With `gapMs`, any two requests start at least
 * that far apart, because the route's limit counts every request from one
 * client (spec 05, Decision 9).
 */
export function createTutorClient(baseUrl, { gapMs = 0 } = {}) {
  let lastStart = Number.NEGATIVE_INFINITY;

  async function waitForTurn() {
    const wait = lastStart + gapMs - performance.now();
    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
    lastStart = performance.now();
  }

  /**
   * Posts the conversation and returns the stream exactly as it arrived, with
   * the time to its first content (a text or a tool call) and to its first
   * text. Throws `RouteError` for a refusal or an error in the stream.
   */
  async function post(messages, context = CONTEXT) {
    await waitForTurn();
    const start = performance.now();
    const response = await fetch(new URL("/api/tutor", baseUrl), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages, context }),
    });
    if (!response.ok) {
      throw new RouteError(response.status, await response.text());
    }
    const decoder = new TextDecoder();
    let sse = "";
    let firstChunkMs = null;
    let firstTextMs = null;
    for await (const bytes of response.body) {
      const elapsed = performance.now() - start;
      const text = decoder.decode(bytes, { stream: true });
      sse += text;
      for (const line of text.split("\n")) {
        const type = line.startsWith(SSE_DATA) && chunkType(line);
        if (type === "text-delta" && firstTextMs === null) {
          firstTextMs = elapsed;
        }
        if (CONTENT_CHUNKS.includes(type) && firstChunkMs === null) {
          firstChunkMs = elapsed;
        }
      }
    }
    if (sse.includes('"type":"error"')) {
      throw new RouteError(response.status, sse);
    }
    return { sse, firstChunkMs, firstTextMs };
  }

  return { post };
}

function chunkType(line) {
  try {
    return JSON.parse(line.slice(SSE_DATA.length)).type;
  } catch {
    return null;
  }
}

/** The learner's message as the page's chat holds it. */
export function learner(id, text) {
  return { id, role: "user", parts: [{ type: "text", text }] };
}

/** The assistant message a recorded stream builds, as the page would. */
export async function messageOf(sse) {
  const chunks = sse
    .split("\n")
    .filter((line) => line.startsWith(SSE_DATA) && line !== "data: [DONE]")
    .map((line) => JSON.parse(line.slice(SSE_DATA.length)));
  let message;
  for await (const snapshot of readUIMessageStream({
    stream: ReadableStream.from(chunks),
  })) {
    message = snapshot;
  }
  return message;
}
