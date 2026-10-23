import { expect, test } from "@playwright/test";
import { es } from "@/content/es";

// Spec 03, G1.
test("home links to the gallery and the lesson", async ({ page }) => {
  await page.goto("/");
  const main = page.getByRole("main");

  await main.getByRole("link", { name: es.home.lesson.link }).click();
  await expect(page).toHaveURL("/learn");
  await expect(
    page.getByRole("heading", { level: 1, name: es.learn.title }),
  ).toBeVisible();

  await page.goBack();
  await main.getByRole("link", { name: es.home.gallery.link }).click();
  await expect(page).toHaveURL("/gallery");
});
