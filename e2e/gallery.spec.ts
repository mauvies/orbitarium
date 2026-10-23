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

test("gallery thumbnails render without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/gallery");

  await expect(page.getByRole("main").locator("svg path")).toHaveCount(
    orbits.length,
  );
  await context.close();
});
