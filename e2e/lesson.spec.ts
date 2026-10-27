import { expect, type Locator, type Page, test } from "@playwright/test";
import {
  CANNON_PRESET_IDS,
  type CannonOutcome,
  type CannonPresetId,
  kmPerSecondToKmPerHour,
  referenceSpeeds,
} from "@/cannon";
import { es } from "@/content/es";
import {
  accentPixels,
  canvasSnapshot,
  contrastRatio,
  hasDrawing,
  waitForFrames,
} from "./support";

const {
  title,
  sections,
  questions,
  question: ui,
  animation,
  cannon,
} = es.gravitation;

const SECTIONS = [
  "falling",
  "mutual",
  "moon",
  "orbit",
  "cannon",
  "law",
] as const;

// Spec 04, "Questions and misconceptions": the first option of each part's
// question and a second one, for the tests that need two answers.
const FIRST_QUESTION = {
  falling: { id: "two-falls", options: ["centre", "south-pole"] },
  mutual: { id: "who-pulls-harder", options: ["equal", "earth"] },
  moon: { id: "twice-as-far", options: ["quarter", "half"] },
  orbit: {
    id: "why-the-moon-does-not-fall",
    options: ["falls-sideways", "no-gravity"],
  },
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
  expect(headings).toEqual(SECTIONS.map((section) => sections[section].title));
});

test("an anchor opens its part", async ({ page }) => {
  await page.goto("/gravitation#law");

  await expect(
    page.getByRole("heading", { name: sections.law.title }),
  ).toBeInViewport();
});

test("a path below /gravitation is a 404", async ({ page }) => {
  const response = await page.goto("/gravitation/falling");

  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { level: 1, name: es.notFound.title }),
  ).toBeVisible();
});

// The folder of the page's parts sits below it but has no page of its own.
test("the folder of the page's parts is not a route", async ({ page }) => {
  const response = await page.goto("/gravitation/sections");

  expect(response?.status()).toBe(404);
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

// Spec 04, L23.
test("the lead links to the cannon", async ({ page }) => {
  await page.goto("/gravitation");

  await page.getByRole("link", { name: es.gravitation.lead.link }).click();

  await expect(page).toHaveURL("/gravitation#cannon");
  await expect(
    page.getByRole("heading", { name: sections.cannon.title }),
  ).toBeInViewport();
});

test("the cannon band holds no questions", async ({ page }) => {
  await page.goto("/gravitation");

  for (const { prompt } of Object.values(questions)) {
    await expect(page.locator("#cannon").getByText(prompt)).toHaveCount(0);
  }
});

test("the cannon band spans the container at 1280 px", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/gravitation");
  const band = await place(page.locator("#cannon"));
  const section = await place(page.locator("#falling"));
  const canvas = await place(page.getByTestId("cannon-canvas"));
  const controls = await place(
    page.getByRole("group", { name: cannon.controlsLabel }),
  );

  expect(band.width).toBe(section.width);
  expect(canvas.width).toBeGreaterThan(controls.width);
  expect(controls.x).toBeGreaterThanOrEqual(canvas.x + canvas.width);
});

test("the cannon band stacks at 360 px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/gravitation");
  const band = await place(page.locator("#cannon"));
  const section = await place(page.locator("#falling"));
  const canvas = await place(page.getByTestId("cannon-canvas"));
  const controls = await place(
    page.getByRole("group", { name: cannon.controlsLabel }),
  );

  expect(band.width).toBe(section.width);
  expect(controls.y).toBeGreaterThanOrEqual(canvas.y + canvas.height);
  expect(controls.x).toBeLessThan(canvas.x + canvas.width);
});

// Spec 04, L12 and L13: the cannon, driven through its controls.
function cannonOf(page: Page) {
  const band = page.locator("#cannon");
  return {
    canvas: band.locator("canvas"),
    speedSlider: band.getByRole("slider", { name: cannon.speed }),
    speedField: band.getByRole("spinbutton", { name: cannon.speedField }),
    angleSlider: band.getByRole("slider", { name: cannon.angle }),
    angleField: band.getByRole("spinbutton", { name: cannon.angleField }),
    altitudeSlider: band.getByRole("slider", { name: cannon.altitude }),
    altitudeField: band.getByRole("spinbutton", {
      name: cannon.altitudeField,
    }),
    launchButton: band.getByRole("button", { name: cannon.launch }),
    clearButton: band.getByRole("button", { name: cannon.clearPaths }),
    preset: (id: CannonPresetId) =>
      band.getByRole("button", { name: cannon.presetLabels[id], exact: true }),
    predictedPath: band.getByRole("checkbox", { name: cannon.predictedPath }),
    status: band.getByRole("status"),
    label: band.getByTestId("cannon-outcome"),
  };
}

/** The canvas once the page has hydrated and drawn the Earth and the cannon. */
async function readyCannon(page: Page) {
  const controls = cannonOf(page);
  await expect(controls.launchButton).toBeEnabled();
  await expect.poll(() => hasDrawing(controls.canvas)).toBe(true);
  return controls;
}

const SPEED_STEP_KM_PER_SECOND = 0.01;
// The ballistic preset, the session's first settings (spec 04, Decision 11).
const FIRST_SETTINGS = {
  speedKmPerSecond: 7,
  angleDegrees: 45,
  altitudeKm: 10,
};
const HIGHEST_KM = 2_000;

function speedText(speedKmPerSecond: number): string {
  return cannon.speedValue(
    speedKmPerSecond,
    kmPerSecondToKmPerHour(speedKmPerSecond),
  );
}

test("launching from the controls draws the shot's path", async ({ page }) => {
  await page.goto("/gravitation");
  const { canvas, launchButton } = await readyCannon(page);
  const beforeLaunch = await canvasSnapshot(canvas);

  await launchButton.click();
  await waitForFrames(page, 10);

  expect(await canvasSnapshot(canvas)).not.toBe(beforeLaunch);
});

test("the canvas describes the last launch", async ({ page }) => {
  await page.goto("/gravitation");
  const { canvas, launchButton } = await readyCannon(page);
  await expect(canvas).toHaveAccessibleName(cannon.canvasLabel.idle);

  await launchButton.click();

  await expect(canvas).toHaveAccessibleName(
    cannon.canvasLabel.launched(
      FIRST_SETTINGS.speedKmPerSecond,
      FIRST_SETTINGS.angleDegrees,
      FIRST_SETTINGS.altitudeKm,
    ),
  );
});

test("the cannon works with the keyboard", async ({ page }) => {
  await page.goto("/gravitation");
  const { canvas, speedSlider, launchButton } = await readyCannon(page);
  const beforeLaunch = await canvasSnapshot(canvas);

  await speedSlider.focus();
  await page.keyboard.press("ArrowRight");
  // The launch button comes first, just before the speed (spec 04, Decision 8).
  await page.keyboard.press("Shift+Tab");
  await expect(launchButton).toBeFocused();
  await page.keyboard.press("Enter");

  const raisedSpeed =
    FIRST_SETTINGS.speedKmPerSecond + SPEED_STEP_KM_PER_SECOND;
  await expect(canvas).toHaveAccessibleName(
    cannon.canvasLabel.launched(
      raisedSpeed,
      FIRST_SETTINGS.angleDegrees,
      FIRST_SETTINGS.altitudeKm,
    ),
  );
  expect(await canvasSnapshot(canvas)).not.toBe(beforeLaunch);
});

test("the speed field adjusts by 0.01 km/s", async ({ page }) => {
  await page.goto("/gravitation");
  const { speedField, speedSlider } = await readyCannon(page);

  await speedField.focus();
  await page.keyboard.press("ArrowUp");

  await expect(speedField).toHaveValue("7.01");
  await expect(speedSlider).toHaveAttribute("aria-valuetext", speedText(7.01));
});

test("a typed speed is applied, and clamped to the range", async ({ page }) => {
  await page.goto("/gravitation");
  const { speedField, speedSlider } = await readyCannon(page);

  await speedField.fill("7.91");
  await expect(speedSlider).toHaveAttribute("aria-valuetext", speedText(7.91));

  await speedField.fill("50");
  await speedField.blur();
  await expect(speedField).toHaveValue("15.00");
  await expect(speedSlider).toHaveAttribute("aria-valuetext", speedText(15));
});

test("reduced motion draws the path at once", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/gravitation");
  const { canvas, launchButton } = await readyCannon(page);
  const beforeLaunch = await canvasSnapshot(canvas);

  await launchButton.click();
  await waitForFrames(page, 2);
  const justAfter = await canvasSnapshot(canvas);
  // The lob lasts 2.9 s on screen; animated, half a second would move it.
  await waitForFrames(page, 30);

  expect(justAfter).not.toBe(beforeLaunch);
  expect(await canvasSnapshot(canvas)).toBe(justAfter);
});

// Spec 04, L9, L12 and L13: the outcome, the earlier paths, the presets and
// the reference speeds.
function announcement(outcome: CannonOutcome, returnsFromAfar = false) {
  return cannon.outcomeAnnouncement(
    cannon.outcomes[outcome].announced,
    returnsFromAfar,
  );
}

// Spec 04, Decision 11: the long ellipse stands for a transfer orbit.
const PRESET_OUTCOMES: Readonly<Record<CannonPresetId, CannonOutcome>> = {
  ballistic: "ballistic",
  "circular-orbit": "circular-orbit",
  "elliptical-orbit": "elliptical-orbit",
  "long-ellipse": "elliptical-orbit",
  escape: "escape",
};

test("each preset shows its outcome label", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/gravitation");
  const { preset, status, label } = await readyCannon(page);

  for (const id of CANNON_PRESET_IDS) {
    await preset(id).click();

    const outcome = PRESET_OUTCOMES[id];
    await expect(status).toHaveText(announcement(outcome));
    await expect(label).toHaveText(cannon.outcomes[outcome].label);
  }
});

test("launching from the controls shows the outcome label", async ({
  page,
}) => {
  await page.goto("/gravitation");
  const { launchButton, label } = await readyCannon(page);

  await launchButton.click();

  // The lob lands after 2.9 s on screen; its label waits for that.
  await expect(label).toHaveText("");
  await expect(label).toHaveText(cannon.outcomes.ballistic.label, {
    timeout: 10_000,
  });
});

test("the outcome is announced", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/gravitation");
  const { launchButton, status } = await readyCannon(page);
  await expect(status).toHaveText("");

  await launchButton.click();

  await expect(status).toHaveText(announcement("ballistic"));
});

test("a shot that comes back from beyond the view says so", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/gravitation");
  const { speedField, angleSlider, launchButton, status, label } =
    await readyCannon(page);

  await speedField.fill("10.5");
  await angleSlider.fill("0");
  await launchButton.click();

  await expect(status).toHaveText(announcement("elliptical-orbit", true));
  await expect(label).toHaveText(
    cannon.outcomeLabel(cannon.outcomes["elliptical-orbit"].label, true),
  );
});

test("earlier paths stay faint until cleared", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/gravitation");
  const first = await readyCannon(page);
  await expect(first.clearButton).toBeDisabled();
  await first.preset("ballistic").click();
  await first.preset("elliptical-orbit").click();
  await expect(first.status).toHaveText(announcement("elliptical-orbit"));
  await waitForFrames(page, 2);
  const twoPaths = await canvasSnapshot(first.canvas);

  await first.clearButton.click();
  await waitForFrames(page, 2);
  const cleared = await canvasSnapshot(first.canvas);

  await page.reload();
  const alone = await readyCannon(page);
  await alone.preset("elliptical-orbit").click();
  await expect(alone.status).toHaveText(announcement("elliptical-orbit"));
  await waitForFrames(page, 2);
  const onePath = await canvasSnapshot(alone.canvas);

  expect(twoPaths).not.toBe(onePath);
  expect(cleared).toBe(onePath);
  await expect(first.clearButton).toBeDisabled();
});

function referenceTexts(altitudeKm: number) {
  const { circularKmPerSecond, escapeKmPerSecond } =
    referenceSpeeds(altitudeKm);
  return [
    cannon.circularReference(circularKmPerSecond),
    cannon.escapeReference(escapeKmPerSecond),
  ];
}

test("the reference speeds are shown on the canvas", async ({ page }) => {
  await page.goto("/gravitation");
  const canvas = page.getByTestId("cannon-canvas");

  for (const text of referenceTexts(FIRST_SETTINGS.altitudeKm)) {
    await expect(canvas.getByText(text)).toBeVisible();
  }
});

// Spec 04, L7 and L13: the height.
test("the reference speeds follow the height", async ({ page }) => {
  await page.goto("/gravitation");
  const { altitudeField } = await readyCannon(page);
  const canvas = page.getByTestId("cannon-canvas");

  await altitudeField.fill(String(HIGHEST_KM));

  for (const text of referenceTexts(HIGHEST_KM)) {
    await expect(canvas.getByText(text)).toBeVisible();
  }
});

test("the height field adjusts by 10 km", async ({ page }) => {
  await page.goto("/gravitation");
  const { altitudeField, altitudeSlider } = await readyCannon(page);

  await altitudeField.focus();
  await page.keyboard.press("ArrowUp");

  await expect(altitudeField).toHaveValue("20");
  await expect(altitudeSlider).toHaveAttribute(
    "aria-valuetext",
    cannon.altitudeValue(20),
  );
});

// Spec 04, L23.
test("the launch and clear buttons come first and each setting is one row", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/gravitation");
  const controls = await readyCannon(page);
  const launch = await place(controls.launchButton);
  const clear = await place(controls.clearButton);
  expect(clear.y).toBeGreaterThan(launch.y);
  expect(clear.width).toBe(launch.width);
  const units = page
    .getByRole("group", { name: cannon.controlsLabel })
    .locator("[data-unit]");
  const rows = [
    [controls.speedSlider, controls.speedField, units.nth(0)],
    [controls.angleSlider, controls.angleField, units.nth(1)],
    [controls.altitudeSlider, controls.altitudeField, units.nth(2)],
  ] as const;

  for (const [slider, field, unit] of rows) {
    const sliderBox = await place(slider);
    const fieldBox = await place(field);
    const unitBox = await place(unit);
    const middle = (box: { y: number; height: number }) =>
      box.y + box.height / 2;

    expect(sliderBox.y).toBeGreaterThan(clear.y + clear.height);
    expect(sliderBox.width).toBeGreaterThan(fieldBox.width);
    expect(fieldBox.x).toBeGreaterThanOrEqual(sliderBox.x + sliderBox.width);
    expect(unitBox.x).toBeGreaterThanOrEqual(fieldBox.x + fieldBox.width);
    for (const box of [fieldBox, unitBox]) {
      expect(Math.abs(middle(box) - middle(sliderBox))).toBeLessThan(
        fieldBox.height / 2,
      );
    }
  }
});

// WCAG 1.4.11: a field whose background matches the panel's is identified
// only by its border, which needs 3:1 against that background. Axe does not
// check it.
const MIN_BOUNDARY_CONTRAST = 3;

test("the cannon's number fields have borders of at least 3:1", async ({
  page,
}) => {
  await page.goto("/gravitation");
  const { speedField, angleField, altitudeField } = await readyCannon(page);
  const background = await page
    .locator("#cannon")
    .evaluate((band) => getComputedStyle(band).backgroundColor);

  for (const field of [speedField, angleField, altitudeField]) {
    const border = await field.evaluate(
      (element) => getComputedStyle(element).borderTopColor,
    );
    expect(contrastRatio(border, background)).toBeGreaterThanOrEqual(
      MIN_BOUNDARY_CONTRAST,
    );
  }
});

// Chrome's DevTools flags form fields without an id or name.
test("every field of the cannon has an id and a name", async ({ page }) => {
  await page.goto("/gravitation");
  await readyCannon(page);

  const unnamed = await page
    .locator("#cannon input")
    .evaluateAll((inputs) =>
      inputs
        .filter((input) => !(input.id && input.getAttribute("name")))
        .map((input) => input.getAttribute("aria-label") ?? input.outerHTML),
    );

  expect(unnamed).toEqual([]);
});

// Spec 04, Decision 11: on a phone the badges are small and name only the
// speed's purpose, and the caption leaves the view to screen readers.
const PHONE_BADGE_MAX_FONT_SIZE_PX = 12;

test("on a phone the reference badges are short", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/gravitation");
  const { circularKmPerSecond, escapeKmPerSecond } = referenceSpeeds(
    FIRST_SETTINGS.altitudeKm,
  );
  const canvas = page.getByTestId("cannon-canvas");

  const orbit = canvas.getByText(
    cannon.circularReferenceShort(circularKmPerSecond),
  );
  const escapeBadge = canvas.getByText(
    cannon.escapeReferenceShort(escapeKmPerSecond),
  );
  await expect(orbit).toBeVisible();
  await expect(escapeBadge).toBeVisible();
  // The full text is still there for screen readers, but 1 px wide.
  const full = await place(
    canvas.getByText(cannon.circularReference(circularKmPerSecond)),
  );
  expect(full.width).toBeLessThanOrEqual(1);
  const badge = canvas.getByRole("listitem").first();
  const fontSize = await badge.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).fontSize),
  );
  expect(fontSize).toBeLessThanOrEqual(PHONE_BADGE_MAX_FONT_SIZE_PX);
  expect((await place(badge)).height).toBeLessThanOrEqual(24);
});

test("on a phone the caption is left to screen readers", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/gravitation");

  // Still in the page for screen readers, but 1 px wide.
  const caption = page.getByText(cannon.caption);
  expect((await place(caption)).width).toBeLessThanOrEqual(1);
  await expect(caption).toHaveCount(1);
});

test("from 640 px the caption is visible", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/gravitation");

  await expect(page.getByText(cannon.caption)).toBeVisible();
});

// Spec 04, Decision 4 and L15: on a phone each part reads title, description,
// picture, question; from 1,024 px the text sits on one side, the picture on
// the other, alternating.
const TEXT_FIRST_SECTIONS = ["falling", "moon", "law"] as const;

for (const section of ANSWERABLE) {
  test(`on a phone ${section} reads title, description, picture, question`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto("/gravitation");
    const part = page.locator(`#${section}`);
    const heading = await place(part.getByRole("heading", { level: 2 }));
    const description = await place(part.locator("p").first());
    const picture = await place(part.locator("figure").first());
    const question = await place(part.locator("fieldset"));

    expect(description.y).toBeGreaterThanOrEqual(heading.y + heading.height);
    expect(picture.y).toBeGreaterThanOrEqual(
      description.y + description.height,
    );
    expect(question.y).toBeGreaterThanOrEqual(picture.y + picture.height);
  });

  test(`from 1,024 px ${section}'s text and picture sit side by side`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/gravitation");
    const part = page.locator(`#${section}`);
    const heading = await place(part.getByRole("heading", { level: 2 }));
    const question = await place(part.locator("fieldset"));
    const picture = await place(part.locator("figure").first());
    const [left, right] = TEXT_FIRST_SECTIONS.some((id) => id === section)
      ? [heading, picture]
      : [picture, heading];

    expect(right.x).toBeGreaterThanOrEqual(left.x + left.width);
    expect(question.x).toBeCloseTo(heading.x, 0);
    expect(question.y).toBeGreaterThan(heading.y);
  });
}

// Spec 04, L24: the predicted path, on by default.
test("the predicted path is on by default", async ({ page }) => {
  await page.goto("/gravitation");
  const { canvas, predictedPath } = await readyCannon(page);
  await expect(predictedPath).toBeChecked();
  const withPath = await canvasSnapshot(canvas);

  await predictedPath.uncheck();
  await waitForFrames(page, 5);

  expect(await canvasSnapshot(canvas)).not.toBe(withPath);
});

test("the predicted path is drawn in the theme's accent", async ({ page }) => {
  await page.goto("/gravitation");
  const { canvas, predictedPath } = await readyCannon(page);
  await predictedPath.uncheck();
  await waitForFrames(page, 5);
  const before = await accentPixels(canvas);

  await predictedPath.check();
  await waitForFrames(page, 5);

  expect(await accentPixels(canvas)).toBeGreaterThan(before);
});

// The canvas does not redraw while idle, so with the toggle off moving a
// control leaves it unchanged.
test("with the toggle off, moving a control draws no path", async ({
  page,
}) => {
  await page.goto("/gravitation");
  const { canvas, predictedPath, speedSlider } = await readyCannon(page);
  await predictedPath.uncheck();
  await waitForFrames(page, 5);
  const before = await canvasSnapshot(canvas);

  await speedSlider.focus();
  for (let step = 0; step < 20; step++) {
    await page.keyboard.press("ArrowRight");
  }
  await waitForFrames(page, 5);

  expect(await canvasSnapshot(canvas)).toBe(before);
});

test("the predicted path follows the speed control and never fires", async ({
  page,
}) => {
  await page.goto("/gravitation");
  const { canvas, speedSlider, label, clearButton, preset } =
    await readyCannon(page);
  const withPath = await canvasSnapshot(canvas);

  await speedSlider.focus();
  for (let step = 0; step < 20; step++) {
    await page.keyboard.press("ArrowRight");
  }
  await waitForFrames(page, 5);
  const faster = await canvasSnapshot(canvas);
  expect(faster).not.toBe(withPath);

  // A prediction, not a launch.
  await expect(label).toHaveText("");
  await expect(clearButton).toBeDisabled();
  await expect(canvas).toHaveAccessibleName(cannon.canvasLabel.idle);

  await preset("elliptical-orbit").click();
  await waitForFrames(page, 5);
  expect(await canvasSnapshot(canvas)).not.toBe(faster);
});

test("the predicted path resets on reload", async ({ page }) => {
  await page.goto("/gravitation");
  const { predictedPath } = await readyCannon(page);
  await predictedPath.uncheck();

  await page.reload();

  await expect((await readyCannon(page)).predictedPath).toBeChecked();
});

// Spec 04, Decisions 12 and 14, L11: only the tutor's launches may scroll.
// The band's own button never moves the page or adds a history entry.
test("launching from the band neither scrolls the page nor adds a history entry", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/gravitation");
  const { canvas, launchButton } = await readyCannon(page);
  await launchButton.scrollIntoViewIfNeeded();

  // Precondition: the learner sees the cannon and the button.
  const viewportHeight = 740;
  const canvasBox = await canvas.boundingBox();
  if (canvasBox === null) {
    throw new Error("the canvas has no box");
  }
  const visible =
    Math.min(canvasBox.y + canvasBox.height, viewportHeight) -
    Math.max(canvasBox.y, 0);
  expect(visible).toBeGreaterThanOrEqual(
    Math.min(canvasBox.height, viewportHeight) / 2,
  );
  await expect(launchButton).toBeInViewport();
  const before = await page.evaluate(() => ({
    scrollY: Math.round(scrollY),
    history: history.length,
    url: location.href,
  }));

  await launchButton.click();
  await waitForFrames(page, 30);

  expect(
    await page.evaluate(() => ({
      scrollY: Math.round(scrollY),
      history: history.length,
      url: location.href,
    })),
  ).toEqual(before);
});
