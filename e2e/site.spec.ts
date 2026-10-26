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
    page.getByRole("link", { name: es.notFound.threeBodyLink }),
  ).toHaveAttribute("href", "/three-body");
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
    page
      .getByRole("main")
      .getByRole("link", { name: es.home.gravitation.link }),
  ).toBeFocused();
});

// docs/design/visual-style.md, "Header": a detail page marks the gallery.
for (const { path, current } of [
  { path: "/", current: undefined },
  { path: "/three-body", current: es.site.navigation.threeBody },
  { path: "/three-body/lagrange", current: es.site.navigation.threeBody },
  { path: "/gravitation/falling", current: es.site.navigation.gravitation },
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
  await page.goto("/gravitation");
  const navigation = page.getByRole("navigation", {
    name: es.site.navigation.label,
  });

  await expect(
    page.getByRole("banner").getByRole("link", { name: es.site.name }),
  ).toHaveAttribute("href", "/");
  await expect(
    navigation.getByRole("link", { name: es.site.navigation.threeBody }),
  ).toHaveAttribute("href", "/three-body");
  await expect(
    navigation.getByRole("link", { name: es.site.navigation.gravitation }),
  ).toHaveAttribute("href", "/gravitation");
});
