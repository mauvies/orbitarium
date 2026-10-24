import { expect, type Page, test } from "@playwright/test";
import { es } from "@/content/es";
import { type OrbitPreset, orbits } from "@/orbits";
import { canvasSnapshot, hasDrawing, waitForFrames } from "./support";

// Enough frames for a first drawing, and for a moving orbit to change pixels.
const FRAMES_TO_DRAW = 5;
const FRAMES_WATCHED = 30;

const orbitCanvas = (page: Page, orbit: OrbitPreset) =>
  page.getByRole("img", {
    name: es.detail.player.canvasLabel(es.orbits[orbit.slug].name),
  });

// Spec 03, G3: each orbit has a shareable URL.
for (const orbit of orbits) {
  const content = es.orbits[orbit.slug];

  test(`each orbit page loads from its URL: ${orbit.slug}`, async ({
    page,
  }) => {
    const response = await page.goto(`/gallery/${orbit.slug}`);

    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(
      es.site.titleTemplate.replace("%s", content.name),
    );
    await expect(
      page.getByRole("heading", { level: 1, name: content.name }),
    ).toBeVisible();
    await expect(page.getByRole("main")).toContainText(content.discovery);
    await expect(page.getByRole("main")).toContainText(
      es.detail.period(orbit.period),
    );
    await expect(page.getByRole("main")).toContainText(
      orbit.holdsWithoutCorrection
        ? es.gallery.stability.holds
        : es.gallery.stability.drifts,
    );
  });
}

test("an unknown orbit is a 404", async ({ page }) => {
  const response = await page.goto("/gallery/no-such-orbit");

  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { level: 1, name: es.notFound.title }),
  ).toBeVisible();
});

// Spec 03, G4.
for (const orbit of orbits) {
  test(`the bodies move: ${orbit.slug}`, async ({ page }) => {
    await page.goto(`/gallery/${orbit.slug}`);
    const canvas = orbitCanvas(page, orbit);
    await expect(canvas).toBeVisible();
    await waitForFrames(page, FRAMES_TO_DRAW);
    expect(await hasDrawing(canvas)).toBe(true);
    const before = await canvasSnapshot(canvas);

    await expect.poll(() => canvasSnapshot(canvas)).not.toBe(before);
  });
}

// Spec 03, Decision 11 and G8.
const [lagrange] = orbits;
if (lagrange === undefined) {
  throw new Error("the catalog is empty");
}

test("the canvas has a text alternative", async ({ page }) => {
  await page.goto(`/gallery/${lagrange.slug}`);

  await expect(orbitCanvas(page, lagrange)).toBeVisible();
});

test("reduced motion starts paused", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`/gallery/${lagrange.slug}`);
  const canvas = orbitCanvas(page, lagrange);
  await expect(
    page.getByRole("button", { name: es.detail.player.play }),
  ).toBeVisible();
  await waitForFrames(page, FRAMES_TO_DRAW);
  expect(await hasDrawing(canvas)).toBe(true);
  const before = await canvasSnapshot(canvas);

  await waitForFrames(page, FRAMES_WATCHED);

  expect(await canvasSnapshot(canvas)).toBe(before);
});

const { player } = es.detail;

// Spec 03, G5 and Decision 11: every control works from the keyboard.
test("controls work with the keyboard", async ({ page }) => {
  // Reduced motion starts paused, at the orbit's initial positions.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`/gallery/${lagrange.slug}`);
  const canvas = orbitCanvas(page, lagrange);
  await waitForFrames(page, FRAMES_TO_DRAW);
  const atStart = await canvasSnapshot(canvas);

  await page.getByRole("button", { name: player.play }).focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: player.pause })).toBeFocused();
  await expect.poll(() => canvasSnapshot(canvas)).not.toBe(atStart);
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: player.play })).toBeFocused();

  await page.getByRole("button", { name: player.restart }).focus();
  await page.keyboard.press("Enter");
  await expect.poll(() => canvasSnapshot(canvas)).toBe(atStart);

  await page.getByRole("radio", { name: player.speedOption(1) }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("radio", { name: player.speedOption(2) }),
  ).toBeChecked();

  for (const name of [player.showPath, player.showTrail, player.correction]) {
    const checkbox = page.getByRole("checkbox", { name });
    await checkbox.focus();
    await page.keyboard.press("Space");
    await expect(checkbox).not.toBeChecked();
  }
  await expect.poll(() => canvasSnapshot(canvas)).not.toBe(atStart);
});

// Spec 03, Decision 10 and G6.
test("detail preferences persist across orbits and reset on reload", async ({
  page,
}) => {
  const otherOrbit = orbits.at(-1);
  if (otherOrbit === undefined || otherOrbit === lagrange) {
    throw new Error("the catalog needs a second orbit");
  }
  const speedTwo = page.getByRole("radio", { name: player.speedOption(2) });
  const trail = page.getByRole("checkbox", { name: player.showTrail });
  const correction = page.getByRole("checkbox", { name: player.correction });
  await page.goto(`/gallery/${lagrange.slug}`);
  await speedTwo.check();
  await trail.uncheck();
  await correction.uncheck();

  await page.getByRole("link", { name: es.detail.backLink }).click();
  await page
    .getByRole("main")
    .getByRole("link", { name: es.orbits[otherOrbit.slug].name })
    .click();
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: es.orbits[otherOrbit.slug].name,
    }),
  ).toBeVisible();

  await expect(speedTwo).toBeChecked();
  await expect(trail).not.toBeChecked();
  await expect(correction).not.toBeChecked();
  await expect(
    page.getByRole("checkbox", { name: player.showPath }),
  ).toBeChecked();

  await page.reload();

  await expect(
    page.getByRole("radio", { name: player.speedOption(1) }),
  ).toBeChecked();
  await expect(trail).toBeChecked();
  await expect(correction).toBeChecked();
});
