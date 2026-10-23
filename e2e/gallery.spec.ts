import { expect, test } from "@playwright/test";
import { es } from "@/content/es";
import { orbits } from "@/orbits";

const stabilityLabel = (holds: boolean) =>
  holds ? es.gallery.stability.holds : es.gallery.stability.drifts;

// Spec 03, G2.
test("gallery lists the six orbits", async ({ page }) => {
  await page.goto("/gallery");
  const items = page.getByRole("main").getByRole("listitem");

  await expect(items).toHaveCount(orbits.length);
  for (const [i, orbit] of orbits.entries()) {
    const item = items.nth(i);
    const name = es.orbits[orbit.slug].name;

    await expect(item.getByRole("link", { name })).toHaveAttribute(
      "href",
      `/gallery/${orbit.slug}`,
    );
    await expect(item).toContainText(
      stabilityLabel(orbit.holdsWithoutCorrection),
    );
    await expect(item.locator("svg path")).toHaveAttribute("d", /^M.*Z$/);
  }
});

// Spec 03, Decision 8 and G7.
const holding = orbits.filter((orbit) => orbit.holdsWithoutCorrection);
const drifting = orbits.filter((orbit) => !orbit.holdsWithoutCorrection);
const namesOf = (subset: typeof orbits) =>
  subset.map((orbit) => es.orbits[orbit.slug].name);

test("the filter shows the matching orbits and survives a reload", async ({
  page,
}) => {
  await page.goto("/gallery");
  const cardTitles = page.getByRole("main").getByRole("heading", { level: 2 });
  await expect(
    page.getByRole("radio", { name: es.gallery.filter.all }),
  ).toBeChecked();

  await page.getByRole("radio", { name: es.gallery.filter.holds }).check();
  await expect(page).toHaveURL("/gallery?filter=holds");
  await expect(cardTitles).toHaveText(namesOf(holding));

  await page.reload();
  await expect(cardTitles).toHaveText(namesOf(holding));
  await expect(
    page.getByRole("radio", { name: es.gallery.filter.holds }),
  ).toBeChecked();

  await page.getByRole("radio", { name: es.gallery.filter.all }).check();
  await expect(page).toHaveURL("/gallery");
  await expect(cardTitles).toHaveCount(orbits.length);
});

test("a shared filtered link opens the gallery filtered", async ({ page }) => {
  await page.goto("/gallery?filter=drifts");

  await expect(
    page.getByRole("main").getByRole("heading", { level: 2 }),
  ).toHaveText(namesOf(drifting));
});

test("an unknown filter shows every orbit", async ({ page }) => {
  await page.goto("/gallery?filter=nope");

  await expect(
    page.getByRole("main").getByRole("heading", { level: 2 }),
  ).toHaveCount(orbits.length);
  await expect(
    page.getByRole("radio", { name: es.gallery.filter.all }),
  ).toBeChecked();
});

test("changing the filter does not add history entries", async ({ page }) => {
  await page.goto("/");
  await page.goto("/gallery");
  await page.getByRole("radio", { name: es.gallery.filter.holds }).check();
  await page.getByRole("radio", { name: es.gallery.filter.drifts }).check();
  await expect(page).toHaveURL("/gallery?filter=drifts");

  await page.goBack();
  await expect(page).toHaveURL("/");
});

test("gallery thumbnails render without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/gallery");

  await expect(page.getByRole("main").locator("svg path")).toHaveCount(
    orbits.length,
  );
  await context.close();
});
