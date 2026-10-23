import { expect, test } from "@playwright/test";
import { es } from "@/content/es";

// Spec 03, Decisions 1 and 2: Next.js's default 404 page is in English.
test("an unknown page shows the Spanish 404", async ({ page }) => {
  const response = await page.goto("/no-such-page");

  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle(
    es.site.titleTemplate.replace("%s", es.notFound.title),
  );
  await expect(
    page.getByRole("heading", { level: 1, name: es.notFound.title }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: es.notFound.galleryLink }),
  ).toHaveAttribute("href", "/gallery");
});

test("the skip link moves keyboard focus past the header", async ({ page }) => {
  await page.goto("/");

  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: es.site.skipToContent });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeInViewport();

  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("main").getByRole("link", { name: es.home.lesson.link }),
  ).toBeFocused();
});

// docs/design/visual-style.md, "Header": a detail page marks the gallery.
for (const { path, current } of [
  { path: "/", current: undefined },
  { path: "/gallery", current: es.site.navigation.gallery },
  { path: "/gallery/lagrange", current: es.site.navigation.gallery },
  { path: "/learn", current: es.site.navigation.learn },
]) {
  test(`the navigation marks the current section on ${path}`, async ({
    page,
  }) => {
    await page.goto(path);
    const marked = page
      .getByRole("navigation", { name: es.site.navigation.label })
      .locator('[aria-current="page"]');

    if (current === undefined) {
      await expect(marked).toHaveCount(0);
    } else {
      await expect(marked).toHaveCount(1);
      await expect(marked).toHaveText(current);
    }
  });
}

test("the header links to every section", async ({ page }) => {
  await page.goto("/learn");
  const navigation = page.getByRole("navigation", {
    name: es.site.navigation.label,
  });

  await expect(
    page.getByRole("banner").getByRole("link", { name: es.site.name }),
  ).toHaveAttribute("href", "/");
  await expect(
    navigation.getByRole("link", { name: es.site.navigation.gallery }),
  ).toHaveAttribute("href", "/gallery");
  await expect(
    navigation.getByRole("link", { name: es.site.navigation.learn }),
  ).toHaveAttribute("href", "/learn");
});
