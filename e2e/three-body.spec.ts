import { expect, type Page, test } from "@playwright/test";
import { es } from "@/content/es";
import { orbits } from "@/orbits";

const stabilityLabel = (holds: boolean) =>
  holds ? es.threeBody.stability.holds : es.threeBody.stability.drifts;

// Spec 03, G2.
test("gallery lists the six orbits", async ({ page }) => {
  await page.goto("/three-body");
  const items = page.getByRole("main").getByRole("listitem");

  await expect(items).toHaveCount(orbits.length);

  for (const [i, orbit] of orbits.entries()) {
    const item = items.nth(i);
    const name = es.orbits[orbit.slug].name;

    await expect(item.getByRole("link", { name })).toHaveAttribute(
      "href",
      `/three-body/${orbit.slug}`,
    );
    await expect(item).toContainText(
      stabilityLabel(orbit.holdsWithoutCorrection),
    );
    await expect(item.locator("svg path")).toHaveAttribute("d", /^M.*Z$/);
  }
});

// Spec 03, G6. One column at 360 px, so the gallery is tall enough to scroll.
test.describe("returning from a detail page", () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test("returning to the gallery keeps its scroll position", async ({
    page,
  }) => {
    const scrolledTo = await openLastOrbitFromScrolledGallery(page);

    await page.goBack();

    await expect(page).toHaveURL("/three-body");
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBe(scrolledTo);
  });

  // Spec 03, Decision 15.
  test("the back link returns to the gallery where it was", async ({
    page,
  }) => {
    const scrolledTo = await openLastOrbitFromScrolledGallery(page);

    await page.getByRole("link", { name: es.detail.backLink }).click();

    await expect(page).toHaveURL("/three-body");
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBe(scrolledTo);
  });

  test("after landing on a detail page, the back link opens the gallery", async ({
    page,
  }) => {
    const orbit = lastOrbit();
    await page.goto(`/three-body/${orbit.slug}`);
    // Hydrated, so the link's own handler decides where it goes.
    await expect(
      page.getByRole("radio", { name: es.detail.player.speedOption(1) }),
    ).toBeEnabled();

    await page.getByRole("link", { name: es.detail.backLink }).click();

    await expect(page).toHaveURL("/three-body");
    await expect(
      page.getByRole("heading", { level: 1, name: es.threeBody.title }),
    ).toBeVisible();
  });
});

test("gallery thumbnails render without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/three-body");

  await expect(
    page.getByRole("main").getByRole("listitem").locator("svg path"),
  ).toHaveCount(orbits.length);

  await context.close();
});

/** Opens the last orbit from the gallery scrolled to its card; returns that scroll. */
async function openLastOrbitFromScrolledGallery(page: Page) {
  await page.goto("/three-body");
  const orbit = lastOrbit();

  const lastCard = page
    .getByRole("main")
    .getByRole("link", { name: es.orbits[orbit.slug].name });

  await lastCard.scrollIntoViewIfNeeded();
  const scrolledTo = await page.evaluate(() => window.scrollY);

  expect(scrolledTo).toBeGreaterThan(0);

  await lastCard.click();

  await expect(
    page.getByRole("heading", { level: 1, name: es.orbits[orbit.slug].name }),
  ).toBeVisible();

  return scrolledTo;
}

function lastOrbit() {
  const orbit = orbits.at(-1);

  if (orbit === undefined) {
    throw new Error("no orbit to open");
  }

  return orbit;
}
