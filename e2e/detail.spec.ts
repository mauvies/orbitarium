import { expect, test } from "@playwright/test";
import { es } from "@/content/es";
import { orbits } from "@/orbits";

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
