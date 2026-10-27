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
  { path: "/gravitation", current: es.site.navigation.gravitation },
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

// Spec 03, Decision 1: on a phone the header keeps the logo and drops the
// name, so the two links fit on one line each.
test("on a phone the header shows only the logo, with the name for screen readers", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/gravitation");
  const home = page.getByRole("banner").getByRole("link", {
    name: es.site.name,
  });

  const name = await home.getByText(es.site.name).boundingBox();
  expect(name?.width).toBeLessThanOrEqual(1);
  const links = page
    .getByRole("navigation", { name: es.site.navigation.label })
    .getByRole("link");
  for (const link of await links.all()) {
    const box = await link.boundingBox();
    expect(box?.height).toBeLessThan(50);
  }
});

test("from 640 px the header shows the name", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/gravitation");

  await expect(page.getByRole("banner").getByText(es.site.name)).toBeVisible();
});

// The tab icon has no background and adapts to the browser's theme: the gold
// is darkened on a light tab.
test("the tab icon is only the orbits and adapts to light and dark", async ({
  page,
  request,
}) => {
  await page.goto("/");
  const href = await page
    .locator("link[rel=icon]")
    .first()
    .getAttribute("href");
  const icon = await (await request.get(href ?? "")).text();

  expect(icon).not.toContain("<rect");
  expect(icon).toContain("prefers-color-scheme: light");
});
