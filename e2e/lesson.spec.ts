import { expect, test } from "@playwright/test";
import { STEP_IDS } from "@/app/gravitation/steps";
import { es } from "@/content/es";

const { steps, navigation, questions, question: questionUi } = es.gravitation;

// Spec 04, L1.
test("/gravitation opens the first step", async ({ page }) => {
  await page.goto("/gravitation");

  await expect(page).toHaveURL("/gravitation/falling");
  await expect(
    page.getByRole("heading", { level: 1, name: steps.falling.title }),
  ).toBeVisible();
});

for (const step of STEP_IDS) {
  test(`each step loads from its URL: ${step}`, async ({ page }) => {
    const response = await page.goto(`/gravitation/${step}`);

    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(
      es.site.titleTemplate.replace("%s", steps[step].title),
    );
    await expect(
      page.getByRole("heading", { level: 1, name: steps[step].title }),
    ).toBeVisible();
  });
}

test("an unknown step is a 404", async ({ page }) => {
  const response = await page.goto("/gravitation/orbit");

  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { level: 1, name: es.notFound.title }),
  ).toBeVisible();
});

// Spec 04, L2: free navigation, by keyboard, with Back returning.
test("steps navigate by keyboard", async ({ page }) => {
  await page.goto("/gravitation/falling");
  const stepList = page.getByRole("navigation", { name: navigation.label });

  await page
    .getByRole("link", { name: navigation.next(steps.mutual.title) })
    .focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/gravitation/mutual");

  await stepList.getByRole("link", { name: steps.law.title }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/gravitation/law");
  await expect(
    stepList.getByRole("link", { name: steps.law.title }),
  ).toHaveAttribute("aria-current", "step");
  await expect(stepList.locator('[aria-current="step"]')).toHaveCount(1);

  await page
    .getByRole("link", { name: navigation.previous(steps.cannon.title) })
    .focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/gravitation/cannon");

  await page.goBack();
  await expect(page).toHaveURL("/gravitation/law");
});

test("the first and last steps have no link past the ends", async ({
  page,
}) => {
  await page.goto("/gravitation/falling");
  await expect(
    page.getByRole("link", { name: navigation.previous("") }),
  ).toHaveCount(0);

  await page.goto("/gravitation/law");
  await expect(
    page.getByRole("link", { name: navigation.next("") }),
  ).toHaveCount(0);
});

// Spec 04, L3: the first answer is recorded, shown and locked.
test("answering shows feedback and locks the question", async ({ page }) => {
  await page.goto("/gravitation/moon");
  const twiceAsFar = questions["twice-as-far"];
  const question = page.getByRole("group", { name: twiceAsFar.prompt });

  await question
    .getByRole("radio", { name: twiceAsFar.options.half.label })
    .check();
  await question.getByRole("button", { name: questionUi.answer }).click();

  await expect(question.getByRole("status")).toContainText(questionUi.wrong);
  await expect(question.getByRole("status")).toContainText(
    twiceAsFar.options.half.feedback,
  );
  for (const radio of await question.getByRole("radio").all()) {
    await expect(radio).toBeDisabled();
  }
  await expect(
    question.getByRole("button", { name: questionUi.answer }),
  ).toHaveCount(0);
});

test("answering needs a choice first", async ({ page }) => {
  await page.goto("/gravitation/falling");
  const question = page.getByRole("group", {
    name: questions["two-falls"].prompt,
  });

  await expect(
    question.getByRole("button", { name: questionUi.answer }),
  ).toBeDisabled();
});

// Spec 04, L2.
test("the lesson keeps its state across steps and resets on reload", async ({
  page,
}) => {
  await page.goto("/gravitation/falling");
  const twoFalls = questions["two-falls"];
  const question = page.getByRole("group", { name: twoFalls.prompt });
  await question
    .getByRole("radio", { name: twoFalls.options.centre.label })
    .check();
  await question.getByRole("button", { name: questionUi.answer }).click();
  await expect(question.getByRole("status")).toContainText(questionUi.correct);

  await page
    .getByRole("link", { name: navigation.next(steps.mutual.title) })
    .click();
  await expect(page).toHaveURL("/gravitation/mutual");
  await page
    .getByRole("link", { name: navigation.previous(steps.falling.title) })
    .click();
  await expect(question.getByRole("status")).toContainText(questionUi.correct);

  await page.reload();
  await expect(
    question.getByRole("radio", { name: twoFalls.options.centre.label }),
  ).toBeEnabled();
  await expect(question.getByRole("status")).toHaveText("");
});
