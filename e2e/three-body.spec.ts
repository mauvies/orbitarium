import { expect, test } from "@playwright/test";
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
    await page.goto("/three-body");
    const lastOrbit = orbits.at(-1);

    if (lastOrbit === undefined) {
      throw new Error("no orbit to open");
    }

    const lastCard = page
      .getByRole("main")
      .getByRole("link", { name: es.orbits[lastOrbit.slug].name });

    await lastCard.scrollIntoViewIfNeeded();
    const scrolledTo = await page.evaluate(() => window.scrollY);

    expect(scrolledTo).toBeGreaterThan(0);

    await lastCard.click();

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: es.orbits[lastOrbit.slug].name,
      }),
    ).toBeVisible();

    await page.goBack();

    await expect(page).toHaveURL("/three-body");
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBe(scrolledTo);
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
