import { expect, type Locator, type Page, test } from "@playwright/test";
import { es } from "@/content/es";

const { title, steps, questions, question: ui, animation } = es.gravitation;

const SECTIONS = ["falling", "mutual", "moon", "cannon", "law"] as const;

// Spec 04, "Questions and misconceptions": the first option of each part's
// question and a second one, for the tests that need two answers.
const FIRST_QUESTION = {
  falling: { id: "two-falls", options: ["centre", "south-pole"] },
  mutual: { id: "who-pulls-harder", options: ["equal", "earth"] },
  moon: { id: "twice-as-far", options: ["quarter", "half"] },
  law: { id: "twice-the-mass", options: ["double", "quadruple"] },
} as const;

type AnswerableSection = keyof typeof FIRST_QUESTION;
const ANSWERABLE = Object.keys(FIRST_QUESTION) as AnswerableSection[];

function questionOf(page: Page, section: AnswerableSection) {
  const { id } = FIRST_QUESTION[section];
  const text = questions[id];
  const box = page.locator(`#${section} fieldset`);
  return {
    box,
    explanation: box.getByRole("status"),
    option: (index: 0 | 1) => {
      const optionId = FIRST_QUESTION[section].options[index];
      const options: Record<string, { label: string; feedback: string }> =
        text.options;
      const option = options[optionId];
      if (option === undefined) {
        throw new RangeError(`no option ${optionId} in ${id}`);
      }
      return {
        ...option,
        button: box.getByRole("button", { name: option.label }),
      };
    },
  };
}

/** Where a box sits in the document, so scrolling does not count as moving. */
function place(locator: Locator) {
  return locator.evaluate((element) => {
    const { x, y, width, height } = element.getBoundingClientRect();
    return { x: x + scrollX, y: y + scrollY, width, height };
  });
}

// Spec 04, L1.
test("the lesson is one page with its sections in order", async ({ page }) => {
  const response = await page.goto("/gravitation");

  expect(response?.status()).toBe(200);
  await expect(page).toHaveURL("/gravitation");
  await expect(page).toHaveTitle(es.site.titleTemplate.replace("%s", title));
  await expect(
    page.getByRole("heading", { level: 1, name: title }),
  ).toBeVisible();
  const headings = await page.locator("main h2, main h3").allInnerTexts();
  expect(headings).toEqual(SECTIONS.map((section) => steps[section].title));
});

test("an anchor opens its part", async ({ page }) => {
  await page.goto("/gravitation#law");

  await expect(
    page.getByRole("heading", { name: steps.law.title }),
  ).toBeInViewport();
});

test("a path below /gravitation is a 404", async ({ page }) => {
  const response = await page.goto("/gravitation/falling");

  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { level: 1, name: es.notFound.title }),
  ).toBeVisible();
});

// Spec 04, L2 and L3.
test("one click answers and shows the explanation", async ({ page }) => {
  await page.goto("/gravitation");
  const { explanation, option } = questionOf(page, "moon");
  const wrong = option(1);

  await wrong.button.click();

  await expect(explanation).toContainText(ui.wrong);
  await expect(explanation).toContainText(ui.correctAnswer(option(0).label));
  await expect(explanation).toContainText(wrong.feedback);
  await expect(wrong.button).toBeHidden();
});

test("questions can be answered in any order", async ({ page }) => {
  await page.goto("/gravitation");
  const law = questionOf(page, "law");
  const falling = questionOf(page, "falling");

  await law.option(0).button.click();
  await expect(law.explanation).toContainText(ui.correct);
  await expect(falling.explanation).toHaveText("");

  await falling.option(0).button.click();
  await expect(falling.explanation).toContainText(ui.correct);
});

test("the lesson's state resets on reload", async ({ page }) => {
  await page.goto("/gravitation");
  const { explanation, option } = questionOf(page, "mutual");
  await option(0).button.click();
  await expect(explanation).toContainText(ui.correct);

  await page.reload();

  await expect(explanation).toHaveText("");
  await expect(option(0).button).toBeEnabled();
});

// Spec 04, L20.
test("answering moves focus to the explanation", async ({ page }) => {
  await page.goto("/gravitation");
  const { explanation, option } = questionOf(page, "falling");

  await option(0).button.focus();
  await page.keyboard.press("Enter");

  await expect(explanation).toBeFocused();
});

test("Ver opciones shows the options and keeps the first answer", async ({
  page,
}) => {
  await page.goto("/gravitation");
  const { box, explanation, option } = questionOf(page, "moon");
  const first = option(1);
  await first.button.click();

  await box.getByRole("button", { name: ui.showOptions }).click();

  await expect(
    box.getByRole("button", { name: `${first.label} (${ui.yourAnswer})` }),
  ).toBeFocused();
  const other = option(0);
  await other.button.click();
  await expect(explanation).toContainText(other.feedback);
  await box.getByRole("button", { name: ui.showOptions }).click();
  await expect(
    box.getByRole("button", { name: `${first.label} (${ui.yourAnswer})` }),
  ).toBeVisible();
});

// Spec 04, L22: the box reserves its explanation's height, so nothing moves.
for (const [width, height] of [
  [1280, 800],
  [360, 740],
] as const) {
  test(`answering moves nothing at ${width} px`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/gravitation");
    for (const section of ANSWERABLE) {
      const { box, option } = questionOf(page, section);
      const picture = page.locator(`#${section} figure`).first();
      const next = page.locator("#law");
      const measure = async () => [
        await place(box),
        await place(picture),
        await place(next),
      ];
      const before = await measure();

      await option(1).button.click();
      const answered = await measure();
      await box.getByRole("button", { name: ui.showOptions }).click();
      const browsing = await measure();
      await option(0).button.click();
      const other = await measure();

      expect(answered, `${section} after answering`).toEqual(before);
      expect(browsing, `${section} on «Ver opciones»`).toEqual(before);
      expect(other, `${section} after another answer`).toEqual(before);
    }
  });
}

// Spec 04, L21: the looping animations can be paused, each on its own.
function animationsIn(page: Page, section: "falling" | "mutual") {
  return page.locator(`#${section}`).evaluate((element) =>
    element.getAnimations({ subtree: true }).map(({ playState, effect }) => ({
      playState,
      iterations: effect?.getComputedTiming().iterations,
    })),
  );
}

test("the animations loop", async ({ page }) => {
  await page.goto("/gravitation");

  for (const section of ["falling", "mutual"] as const) {
    const animations = await animationsIn(page, section);
    expect(animations.length).toBeGreaterThan(0);
    expect(animations.every(({ iterations }) => iterations === Infinity)).toBe(
      true,
    );
  }
});

test("pausing stops only its own animation", async ({ page }) => {
  await page.goto("/gravitation");

  await page
    .locator("#mutual")
    .getByRole("button", { name: animation.pause })
    .click();

  const mutual = await animationsIn(page, "mutual");
  const falling = await animationsIn(page, "falling");
  expect(mutual.every(({ playState }) => playState === "paused")).toBe(true);
  expect(falling.every(({ playState }) => playState === "running")).toBe(true);
  await expect(
    page.locator("#mutual").getByRole("button", { name: animation.resume }),
  ).toBeVisible();
});

test("reduced motion shows the two pictures at rest", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/gravitation");

  expect(await animationsIn(page, "falling")).toEqual([]);
  expect(await animationsIn(page, "mutual")).toEqual([]);
  await expect(page.getByRole("button", { name: animation.pause })).toHaveCount(
    0,
  );
});
