import { expect, test } from "@playwright/test";
import { es } from "@/content/es";

// Spec 03, G1.
test("home links to the gallery and the lesson", async ({ page }) => {
  await page.goto("/");
  const main = page.getByRole("main");

  await main.getByRole("link", { name: es.home.gravitation.link }).click();

  await expect(page).toHaveURL("/gravitation");
  await expect(
    page.getByRole("heading", { level: 1, name: es.gravitation.title }),
  ).toBeInViewport();

  await page.goBack();
  await main.getByRole("link", { name: es.home.threeBody.link }).click();

  await expect(page).toHaveURL("/three-body");
});
