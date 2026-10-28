import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import {
  expect,
  type Locator,
  type Page,
  type Route,
  test,
} from "@playwright/test";
import { z } from "zod";
import { es } from "@/content/es";
import { MAX_CONVERSATION_MESSAGES, SLOW_ANSWER_MS } from "@/lib/tutor/limits";

const { tutor, sections, cannon, question, questions } = es.gravitation;

// Spec 03, G8: WCAG 2.1 levels A and AA.
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];
// The theme's accent, #FCB810, as the browser reports it.
const ACCENT = "rgb(252, 184, 16)";
const WIDE = { width: 1280, height: 800 };
const PHONE = { width: 360, height: 740 };

// Spec 05, "Testing without the real model": streams recorded once from the
// real model by `pnpm record:tutor`.
type Recording =
  | "answer"
  | "launch-call"
  | "launch-continuation"
  | "move-call"
  | "move-continuation";

const QUESTION = "¿Por qué no cae la Luna?";
const LAUNCH = "Dispara el cañón a 8 km/s.";
const MOVE = "Llévame a la parte de la Luna.";

function recording(name: Recording): string {
  return readFileSync(resolve("e2e/fixtures/tutor", `${name}.sse`), "utf8");
}

/** The text a recorded stream writes, as the learner reads it. */
function recordedText(name: Recording): string {
  return recording(name)
    .split("\n")
    .filter((line) => line.startsWith("data: {"))
    .map((line) =>
      z
        .object({ delta: z.string().optional() })
        .parse(JSON.parse(line.slice(6))),
    )
    .map(({ delta }) => delta ?? "")
    .join("");
}

const sentRequest = z.object({
  messages: z.array(
    z.object({
      role: z.string(),
      parts: z.array(
        z.looseObject({ type: z.string(), text: z.string().optional() }),
      ),
    }),
  ),
  context: z.looseObject({
    cannon: z.looseObject({
      lastLaunch: z.looseObject({ speedKmPerSecond: z.number() }).nullable(),
    }),
  }),
});

type SentRequest = z.infer<typeof sentRequest>;

/** The recording that answers a request, chosen by its last message. */
function recordingFor({ messages }: SentRequest): Recording {
  const last = messages.at(-1);
  if (last?.role === "assistant") {
    return last.parts.some(({ type }) => type === "tool-launchCannon")
      ? "launch-continuation"
      : "move-continuation";
  }
  const text = last?.parts.map((part) => part.text ?? "").join("") ?? "";
  if (text === LAUNCH) {
    return "launch-call";
  }
  if (text === MOVE) {
    return "move-call";
  }
  return "answer";
}

/**
 * Answers `/api/tutor` with the recordings and keeps every request sent.
 * With `held`, nothing is answered until `release` is called.
 */
async function serveTutor(page: Page, { held = false } = {}) {
  const requests: SentRequest[] = [];
  let release = () => {};
  const released = new Promise<void>((resolveRelease) => {
    release = resolveRelease;
  });
  await page.route("**/api/tutor", async (route: Route) => {
    if (route.request().method() === "GET") {
      return route.fallback();
    }
    const request = sentRequest.parse(route.request().postDataJSON());
    requests.push(request);
    if (held) {
      await released;
    }
    await route.fulfill({
      status: 200,
      headers: STREAM_HEADERS,
      body: recording(recordingFor(request)),
    });
  });
  return { requests, release };
}

const STREAM_HEADERS = {
  "content-type": "text/event-stream",
  "x-vercel-ai-ui-message-stream": "v1",
};

/**
 * Answers `GET /api/tutor`, the check of whether the tutor is set up, in
 * order: the last answer repeats. A route added later is tried first, so a
 * test can replace the default one below.
 */
async function serveAvailability(
  page: Page,
  ...answers: readonly ({ available: boolean } | "fails")[]
) {
  let checks = 0;
  await page.route("**/api/tutor", async (route: Route) => {
    if (route.request().method() !== "GET") {
      return route.fallback();
    }
    const answer = answers[Math.min(checks++, answers.length - 1)];
    if (answer === "fails") {
      return route.fulfill({ status: 500, body: "boom" });
    }
    return route.fulfill({ json: answer });
  });
  return { checks: () => checks };
}

/** Fails the next request as the route does: a stream that ends in an error chunk. */
async function failTutor(page: Page, code: string, failures = 1) {
  let calls = 0;
  await page.route("**/api/tutor", async (route: Route) => {
    if (route.request().method() === "GET") {
      return route.fallback();
    }
    calls++;
    if (calls > failures) {
      return route.fallback();
    }
    return route.fulfill({
      status: 200,
      headers: STREAM_HEADERS,
      body: `data: {"type":"start"}\n\ndata: {"type":"error","errorText":"${code}"}\n\ndata: [DONE]\n\n`,
    });
  });
  return { calls: () => calls };
}

test.beforeEach(async ({ page }) => {
  await serveAvailability(page, { available: true });
});

/** The notice as shown; the hidden region repeats its text for screen readers. */
function noticeIn(panel: Locator, text: string) {
  return panel.getByRole("paragraph").filter({ hasText: text });
}

function tutorOf(page: Page) {
  const panel = page.getByRole("dialog", { name: tutor.title });
  // The panel's two hidden regions, in order: finished answers, then moves.
  const regions = panel.locator("output");
  return {
    toggle: page.getByRole("button", { name: tutor.toggle }),
    panel,
    close: panel.getByRole("button", { name: tutor.close }),
    restart: panel.getByRole("button", { name: tutor.newConversation }),
    input: panel.getByRole("textbox", { name: tutor.input }),
    send: panel.getByRole("button", { name: tutor.send }),
    conversation: panel.getByRole("region", { name: tutor.conversation }),
    answerAnnouncement: regions.first(),
    moveAnnouncement: regions.last(),
  };
}

async function openTutor(page: Page) {
  const tutorPanel = tutorOf(page);
  await expect(tutorPanel.toggle).toBeEnabled();
  await tutorPanel.toggle.click();
  await expect(tutorPanel.panel).toBeVisible();
  return tutorPanel;
}

async function ask(page: Page, text: string) {
  const { input } = tutorOf(page);
  await input.fill(text);
  await input.press("Enter");
}

test.describe("opening", () => {
  test.describe("from 1,280 px", () => {
    test.use({ viewport: WIDE });

    test("from 1,280 px opening focuses the input", async ({ page }) => {
      await page.goto("/gravitation");
      const { input } = await openTutor(page);

      await expect(input).toBeFocused();
    });
  });

  test.describe("below 1,280 px", () => {
    test.use({ viewport: PHONE });

    test("below 1,280 px opening focuses the close button", async ({
      page,
    }) => {
      await page.goto("/gravitation");
      const { close } = await openTutor(page);

      await expect(close).toBeFocused();
    });
  });

  test("the greeting is shown, without the line about firing", async ({
    page,
  }) => {
    await page.goto("/gravitation");
    const { panel } = await openTutor(page);

    await expect(panel.getByText(tutor.greeting)).toBeVisible();
    await expect(panel.getByText(tutor.greetingAtCannon)).toHaveCount(0);
  });

  test("«Nueva conversación» appears once there are messages", async ({
    page,
  }) => {
    await serveTutor(page);
    await page.goto("/gravitation");
    const { restart, conversation } = await openTutor(page);
    await expect(restart).toHaveCount(0);

    await ask(page, QUESTION);
    await expect(conversation).toContainText(recordedText("answer"));

    await expect(restart).toBeVisible();
  });

  test("with the cannon at the top the greeting suggests firing", async ({
    page,
  }) => {
    await page.goto("/gravitation#cannon");
    const { panel } = await openTutor(page);

    await expect(panel.getByText(tutor.greetingAtCannon)).toBeVisible();
  });
});

// Spec 05, Decision 11: the panel is over the page, so scrolling over it
// never scrolls the page behind.
for (const viewport of [PHONE, WIDE]) {
  test.describe(`scrolling over the panel at ${viewport.width} px`, () => {
    test.use({ viewport });

    test("does not scroll the page behind it", async ({ page }) => {
      await serveTutor(page);
      await page.goto("/gravitation");
      const { panel, conversation } = await openTutor(page);
      await page.evaluate(() => window.scrollTo(0, 600));
      const scrolled = await page.evaluate(() => window.scrollY);
      expect(scrolled).toBeGreaterThan(0);

      for (const area of [panel.getByRole("heading"), conversation]) {
        await area.hover();
        await page.mouse.wheel(0, 400);
        await page.waitForTimeout(150);
        expect(await page.evaluate(() => window.scrollY)).toBe(scrolled);
      }
    });

    test("does not scroll the page behind a long conversation either", async ({
      page,
    }) => {
      await serveTutor(page);
      await page.goto("/gravitation");
      const { conversation } = await openTutor(page);
      for (let turn = 0; turn < 4; turn++) {
        await ask(page, QUESTION);
        await expect(conversation).toContainText(recordedText("answer"));
      }
      await page.evaluate(() => window.scrollTo(0, 600));
      const scrolled = await page.evaluate(() => window.scrollY);

      await conversation.hover();
      // Past the conversation's own end, where the scroll would chain.
      await page.mouse.wheel(0, 3000);
      await page.mouse.wheel(0, 3000);
      await page.waitForTimeout(150);

      expect(await page.evaluate(() => window.scrollY)).toBe(scrolled);
    });
  });
}

test.describe("writing", () => {
  test("Enter sends and Shift+Enter adds a line", async ({ page }) => {
    await serveTutor(page);
    await page.goto("/gravitation");
    const { input, conversation } = await openTutor(page);

    await input.fill("Una línea");
    await input.press("Shift+Enter");
    await input.pressSequentially("y otra");
    await expect(input).toHaveValue("Una línea\ny otra");

    await input.press("Enter");

    await expect(conversation).toContainText("Una línea");
    await expect(input).toHaveValue("");
  });

  // Visual style, "Focus" and "Tutor's panel": the field is outlined by a
  // light border, not by the accent ring, which looked heavy around it.
  test("the focused field is outlined by a light border, not an accent ring", async ({
    page,
  }) => {
    await page.goto("/gravitation");
    const { panel, input } = await openTutor(page);
    const field = panel.locator("form");
    const outline = () =>
      field.evaluate((element) => {
        const { borderTopColor, outlineColor, outlineStyle } =
          getComputedStyle(element);
        return { borderTopColor, outlineColor, outlineStyle };
      });
    await panel.getByRole("button", { name: tutor.close }).focus();
    const blurred = await outline();

    await input.focus();
    const focused = await outline();

    expect(focused.borderTopColor).not.toBe(blurred.borderTopColor);
    expect(focused.outlineColor).not.toBe(ACCENT);
  });

  test("Enter while composing does not send", async ({ page }) => {
    const { requests } = await serveTutor(page);
    await page.goto("/gravitation");
    const { input } = await openTutor(page);
    await input.fill("acentu");

    // A dead key in progress, as typing "á" leaves it.
    await input.evaluate((element) =>
      element.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Enter",
          isComposing: true,
          bubbles: true,
        }),
      ),
    );

    await expect(input).toHaveValue("acentu");
    expect(requests).toHaveLength(0);
  });

  test("the input stops at 500 characters", async ({ page }) => {
    await page.goto("/gravitation");
    const { input } = await openTutor(page);

    await expect(input).toHaveAttribute("maxlength", "500");
  });

  test("while waiting, sending is disabled, «Pensando…» shows and nothing is announced", async ({
    page,
  }) => {
    const { release } = await serveTutor(page, { held: true });
    await page.goto("/gravitation");
    const { panel, send, answerAnnouncement } = await openTutor(page);

    await ask(page, QUESTION);

    await expect(panel.getByText(tutor.thinking)).toBeVisible();
    await expect(send).toBeDisabled();
    await expect(answerAnnouncement).toHaveText("");

    release();

    await expect(panel.getByText(tutor.thinking)).toHaveCount(0);
    await expect(send).toBeEnabled();
  });

  // Spec 05, Decision 11 and T18.
  test("a slow answer says the tutor is in high demand", async ({ page }) => {
    await page.clock.install();
    const { release } = await serveTutor(page, { held: true });
    await page.goto("/gravitation");
    const { panel, answerAnnouncement } = await openTutor(page);
    await ask(page, QUESTION);
    await expect(panel.getByText(tutor.thinking)).toBeVisible();

    await page.clock.runFor(SLOW_ANSWER_MS);

    await expect(panel.getByText(tutor.slowAnswer)).toBeVisible();
    await expect(panel.getByText(tutor.thinking)).toHaveCount(0);
    await expect(answerAnnouncement).toHaveText(tutor.slowAnswer);

    release();

    await expect(panel.getByText(tutor.slowAnswer)).toHaveCount(0);
  });
});

test.describe("answers", () => {
  test("a finished answer is announced once, in full", async ({ page }) => {
    await serveTutor(page);
    await page.goto("/gravitation");
    const { conversation, answerAnnouncement } = await openTutor(page);

    await ask(page, QUESTION);

    await expect(conversation).toContainText(recordedText("answer"));
    await expect(answerAnnouncement).toHaveText(recordedText("answer"));
  });

  test("the conversation survives closing and reopening", async ({ page }) => {
    await serveTutor(page);
    await page.goto("/gravitation");
    const { close, toggle, conversation } = await openTutor(page);
    await ask(page, QUESTION);
    await expect(conversation).toContainText(recordedText("answer"));

    await close.click();
    await toggle.click();

    await expect(conversation).toContainText(recordedText("answer"));
  });

  test("«Nueva conversación» clears it", async ({ page }) => {
    await serveTutor(page);
    await page.goto("/gravitation");
    const { restart, conversation, panel } = await openTutor(page);
    await ask(page, QUESTION);
    await expect(conversation).toContainText(recordedText("answer"));

    await restart.click();

    await expect(conversation).not.toContainText(QUESTION);
    await expect(panel.getByText(tutor.greeting)).toBeVisible();
  });

  test("a reload starts over", async ({ page }) => {
    await serveTutor(page);
    await page.goto("/gravitation");
    await openTutor(page);
    await ask(page, QUESTION);
    await expect(tutorOf(page).conversation).toContainText(QUESTION);

    await page.reload();
    const { conversation } = await openTutor(page);

    await expect(conversation).not.toContainText(QUESTION);
  });
});

// Spec 05, T9 and T3: the tutor drives the lesson through its controls.
test.describe("the tutor's actions", () => {
  test("the tutor launches the cannon", async ({ page }) => {
    await serveTutor(page);
    await page.goto("/gravitation#cannon");
    const { conversation } = await openTutor(page);

    await ask(page, LAUNCH);

    await expect(conversation).toContainText(
      /Disparo el cañón a 8,00 km\/s, 45° y 10 km: /,
    );
    await expect(conversation).toContainText(
      recordedText("launch-continuation"),
    );
    await expect(
      page.locator("#cannon").getByRole("slider", { name: cannon.speed }),
    ).toHaveAttribute("aria-valuetext", /^8,00 km\/s/);
  });

  test("the resend after a tool carries the latest launch", async ({
    page,
  }) => {
    const { requests } = await serveTutor(page);
    await page.goto("/gravitation#cannon");
    const { conversation } = await openTutor(page);

    await ask(page, LAUNCH);
    await expect(conversation).toContainText(
      recordedText("launch-continuation"),
    );

    expect(requests[0]?.context.cannon.lastLaunch).toBeNull();
    expect(requests[1]?.context.cannon.lastLaunch?.speedKmPerSecond).toBe(8);
  });

  // Spec 05, Decision 3: 30 messages count a tool's call, its result and the
  // answer after it as one tutor message.
  test("a tool's call and the answer after it stay one message", async ({
    page,
  }) => {
    const { requests } = await serveTutor(page);
    await page.goto("/gravitation#cannon");
    const { conversation } = await openTutor(page);
    await ask(page, LAUNCH);
    await expect(conversation).toContainText(
      recordedText("launch-continuation"),
    );

    await ask(page, QUESTION);
    await expect(conversation).toContainText(recordedText("answer"));

    expect(requests.map(({ messages }) => messages.length)).toEqual([1, 2, 3]);
    expect(requests[2]?.messages.map(({ role }) => role)).toEqual([
      "user",
      "assistant",
      "user",
    ]);
  });

  test("the tutor's launch out of view brings the cannon into view", async ({
    page,
  }) => {
    await serveTutor(page);
    await page.goto("/gravitation");
    const { conversation } = await openTutor(page);

    await ask(page, LAUNCH);
    await expect(conversation).toContainText(
      recordedText("launch-continuation"),
    );

    await expect(page.locator("#cannon canvas")).toBeInViewport({
      ratio: 0.5,
    });
  });

  test("the tutor moves to a part and focus stays in the panel", async ({
    page,
  }) => {
    await serveTutor(page);
    await page.goto("/gravitation");
    const { panel, conversation } = await openTutor(page);

    await ask(page, MOVE);
    await expect(conversation).toContainText(`Voy a “${sections.moon.title}”.`);

    await expect(page).toHaveURL(/#moon$/);
    await expect(panel.locator(":focus")).toHaveCount(1);
  });

  test("a move and the message after it are both announced", async ({
    page,
  }) => {
    await serveTutor(page);
    await page.goto("/gravitation");
    const { answerAnnouncement, moveAnnouncement } = await openTutor(page);

    await ask(page, MOVE);

    await expect(moveAnnouncement).toHaveText(
      tutor.movedTo(sections.moon.title),
    );
    await expect(answerAnnouncement).toHaveText(
      recordedText("move-continuation"),
    );
  });
});

// Spec 05, Decision 10 and T8: a failure is shown as text, announced once,
// and the learner's message stays.
test.describe("errors", () => {
  for (const code of [
    "rate-limited",
    "daily-limit",
    "busy",
    "unavailable",
  ] as const) {
    test(`${code} is shown with «Reintentar», announced, and the message stays`, async ({
      page,
    }) => {
      await failTutor(page, code);
      await page.goto("/gravitation");
      const { panel, conversation, input, send, answerAnnouncement } =
        await openTutor(page);

      await ask(page, QUESTION);

      await expect(noticeIn(panel, tutor.errors[code])).toBeVisible();
      await expect(
        panel.getByRole("button", { name: tutor.retry }),
      ).toBeVisible();
      await expect(answerAnnouncement).toHaveText(tutor.errors[code]);
      await expect(conversation).toContainText(QUESTION);
      await expect(input).toHaveValue("");
      await expect(send).toBeEnabled();
    });
  }

  test("a refusal that is not a code reads as unavailable", async ({
    page,
  }) => {
    await page.route("**/api/tutor", (route) =>
      route.request().method() === "GET"
        ? route.fallback()
        : route.fulfill({ status: 400, body: "context.section: not a part" }),
    );
    await page.goto("/gravitation");
    const { panel } = await openTutor(page);

    await ask(page, QUESTION);

    await expect(noticeIn(panel, tutor.errors.unavailable)).toBeVisible();
  });

  test("too-long from the route has no «Reintentar»", async ({ page }) => {
    await page.route("**/api/tutor", (route) =>
      route.request().method() === "GET"
        ? route.fallback()
        : route.fulfill({ status: 400, body: "too-long" }),
    );
    await page.goto("/gravitation");
    const { panel } = await openTutor(page);

    await ask(page, QUESTION);

    await expect(noticeIn(panel, tutor.errors["too-long"])).toBeVisible();
    await expect(panel.getByRole("button", { name: tutor.retry })).toHaveCount(
      0,
    );
  });

  // Spec 05, Decision 9: the route refuses with HTTP 429 and the code as body.
  test("a request the route's limit refuses shows its text with «Reintentar»", async ({
    page,
  }) => {
    await page.route("**/api/tutor", (route) =>
      route.request().method() === "GET"
        ? route.fallback()
        : route.fulfill({ status: 429, body: "daily-limit" }),
    );
    await page.goto("/gravitation");
    const { panel, conversation } = await openTutor(page);

    await ask(page, QUESTION);

    await expect(noticeIn(panel, tutor.errors["daily-limit"])).toBeVisible();
    await expect(
      panel.getByRole("button", { name: tutor.retry }),
    ).toBeVisible();
    await expect(conversation).toContainText(QUESTION);
  });

  test("«Reintentar» answers the same message again", async ({ page }) => {
    const { requests } = await serveTutor(page);
    const failed = await failTutor(page, "rate-limited");
    await page.goto("/gravitation");
    const { panel, conversation } = await openTutor(page);
    await ask(page, QUESTION);
    await expect(noticeIn(panel, tutor.errors["rate-limited"])).toBeVisible();

    await panel.getByRole("button", { name: tutor.retry }).click();

    await expect(conversation).toContainText(recordedText("answer"));
    await expect(noticeIn(panel, tutor.errors["rate-limited"])).toHaveCount(0);
    expect(failed.calls()).toBe(2);
    expect(requests).toHaveLength(1);
    expect(requests[0]?.messages.map(({ role }) => role)).toEqual(["user"]);
    await expect(conversation.getByText(QUESTION)).toHaveCount(1);
  });

  test("«Nueva conversación» clears the error", async ({ page }) => {
    await failTutor(page, "unavailable");
    await page.goto("/gravitation");
    const { panel, restart } = await openTutor(page);
    await ask(page, QUESTION);
    await expect(noticeIn(panel, tutor.errors.unavailable)).toBeVisible();

    await restart.click();

    await expect(noticeIn(panel, tutor.errors.unavailable)).toHaveCount(0);
  });

  test("the thirty-first message is not sent", async ({ page }) => {
    const { requests } = await serveTutor(page);
    await page.goto("/gravitation");
    const { panel, conversation, input, send } = await openTutor(page);
    const exchanges = MAX_CONVERSATION_MESSAGES / 2;
    for (let turn = 1; turn <= exchanges; turn++) {
      await ask(page, QUESTION);
      await expect(
        conversation.getByText(tutor.tutor, { exact: true }),
      ).toHaveCount(turn);
      // The last answer fills the conversation, so nothing more is accepted.
      if (turn < exchanges) {
        await expect(send).toBeEnabled();
      }
    }

    await expect(noticeIn(panel, tutor.errors["too-long"])).toBeVisible();
    await expect(input).toHaveAttribute("readonly", "");
    await expect(send).toBeDisabled();
    await expect(panel.getByRole("button", { name: tutor.retry })).toHaveCount(
      0,
    );
    expect(requests).toHaveLength(exchanges);
  });
});

// Spec 05, Decision 12 and T16.
test.describe("without a key", () => {
  test("the panel explains how to enable the tutor", async ({ page }) => {
    await serveAvailability(page, { available: false });
    await page.goto("/gravitation");
    const { panel, input, send, answerAnnouncement } = await openTutor(page);

    await expect(noticeIn(panel, tutor.notSet)).toBeVisible();
    await expect(answerAnnouncement).toHaveText(tutor.notSet);
    await expect(input).toHaveAttribute("readonly", "");
    await expect(send).toBeDisabled();
    await expect(panel.getByRole("button", { name: tutor.retry })).toHaveCount(
      0,
    );
  });

  test("the panel asks once", async ({ page }) => {
    const { checks } = await serveAvailability(page, { available: true });
    await page.goto("/gravitation");
    const { close, toggle, input } = await openTutor(page);
    await expect(input).not.toHaveAttribute("readonly", "");

    await close.click();
    await toggle.click();
    await close.click();
    await toggle.click();

    expect(checks()).toBe(1);
  });

  test("it does not ask before the panel opens", async ({ page }) => {
    const { checks } = await serveAvailability(page, { available: true });
    await page.goto("/gravitation");
    await expect(tutorOf(page).toggle).toBeEnabled();

    expect(checks()).toBe(0);
  });

  test("a failed check offers to retry", async ({ page }) => {
    await serveAvailability(page, "fails", { available: true });
    await page.goto("/gravitation");
    const { panel, input } = await openTutor(page);
    await expect(noticeIn(panel, tutor.errors.unavailable)).toBeVisible();

    await panel.getByRole("button", { name: tutor.retry }).click();

    await expect(noticeIn(panel, tutor.errors.unavailable)).toHaveCount(0);
    await expect(input).not.toHaveAttribute("readonly", "");
  });
});

async function answerMoonQuestionWrongly(page: Page) {
  const box = page.locator("#moon fieldset");
  await box
    .getByRole("button", { name: questions["twice-as-far"].options.half.label })
    .click();
  return {
    box,
    ask: box.getByRole("button", { name: question.askTutor }),
    showOptions: box.getByRole("button", { name: question.showOptions }),
  };
}

for (const viewport of [PHONE, WIDE]) {
  test.describe(`asking from a question at ${viewport.width} px`, () => {
    test.use({ viewport });

    test("«Preguntar al tutor» opens the panel with the question written and sends nothing", async ({
      page,
    }) => {
      const { requests } = await serveTutor(page);
      await page.goto("/gravitation");
      const { ask } = await answerMoonQuestionWrongly(page);

      await ask.click();

      const { panel, input } = tutorOf(page);
      await expect(panel).toBeVisible();
      await expect(input).toHaveValue(
        question.askAboutWrongAnswer(sections.moon.title),
      );
      expect(requests).toHaveLength(0);
    });

    test("no axe violations on the question with both buttons", async ({
      page,
    }) => {
      await page.goto("/gravitation");
      const { ask, showOptions } = await answerMoonQuestionWrongly(page);
      await expect(ask).toBeVisible();
      await expect(showOptions).toBeVisible();

      const results = await new AxeBuilder({ page })
        .withTags(WCAG_TAGS)
        .include("#moon fieldset")
        .analyze();

      expect(results.violations).toEqual([]);
    });
  });
}

test.describe("asking again from a question", () => {
  test("after choosing another option, the question follows it", async ({
    page,
  }) => {
    await page.goto("/gravitation");
    const { box, ask, showOptions } = await answerMoonQuestionWrongly(page);
    await ask.click();
    const { input } = tutorOf(page);
    await expect(input).toHaveValue(
      question.askAboutWrongAnswer(sections.moon.title),
    );

    await showOptions.click();
    await box
      .getByRole("button", {
        name: questions["twice-as-far"].options.quarter.label,
      })
      .click();
    await ask.click();

    await expect(input).toHaveValue(
      question.askAboutCorrectAnswer(sections.moon.title),
    );
  });

  test("what the learner wrote is kept", async ({ page }) => {
    await page.goto("/gravitation");
    const { ask } = await answerMoonQuestionWrongly(page);
    await ask.click();
    const { input } = tutorOf(page);
    await input.fill(QUESTION);

    await ask.click();

    await expect(input).toHaveValue(QUESTION);
  });
});

for (const viewport of [PHONE, WIDE]) {
  test.describe(`at ${viewport.width} px`, () => {
    test.use({ viewport });

    test("no axe violations with a conversation and a tool line", async ({
      page,
    }) => {
      await serveTutor(page);
      await page.goto("/gravitation#cannon");
      const { conversation } = await openTutor(page);
      await ask(page, LAUNCH);
      await expect(conversation).toContainText(
        recordedText("launch-continuation"),
      );

      const results = await new AxeBuilder({ page })
        .withTags(WCAG_TAGS)
        .analyze();

      expect(results.violations).toEqual([]);
    });

    test("no axe violations with an error shown", async ({ page }) => {
      await failTutor(page, "rate-limited");
      await page.goto("/gravitation");
      const { panel } = await openTutor(page);
      await ask(page, QUESTION);
      await expect(noticeIn(panel, tutor.errors["rate-limited"])).toBeVisible();

      const results = await new AxeBuilder({ page })
        .withTags(WCAG_TAGS)
        .analyze();

      expect(results.violations).toEqual([]);
    });
  });
}
