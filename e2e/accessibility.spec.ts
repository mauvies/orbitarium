import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { es } from "@/content/es";
import { orbits } from "@/orbits";

// Spec 03, G8: WCAG 2.1 levels A and AA.
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

// The longest a page's tab order runs before focus leaves the document.
const MAX_TABS = 60;

type CheckedPage = {
  readonly name: string;
  readonly path: string;
  /** Waits until the page's controls are hydrated and can take focus. */
  readonly ready?: (page: Page) => Promise<void>;
};

const galleryReady = (page: Page) =>
  expect(
    page.getByRole("radio", { name: es.threeBody.filter.all }),
  ).toBeEnabled();
const detailReady = (page: Page) =>
  expect(
    page.getByRole("button", { name: es.detail.player.restart }),
  ).toBeEnabled();

const PAGES: readonly CheckedPage[] = [
  { name: "the home page", path: "/" },
  { name: "the gallery", path: "/three-body", ready: galleryReady },
  {
    name: "a filtered gallery",
    path: "/three-body?filter=holds",
    ready: galleryReady,
  },
  ...orbits.map((orbit) => ({
    name: `the ${orbit.slug} page`,
    path: `/three-body/${orbit.slug}`,
    ready: detailReady,
  })),
  { name: "the first lesson step", path: "/gravitation/falling" },
  { name: "the 404 page", path: "/no-such-page" },
];

for (const { name, path, ready } of PAGES) {
  test(`has no axe violations on ${name}`, async ({ page }) => {
    await page.goto(path);
    await ready?.(page);

    const results = await new AxeBuilder({ page })
      .withTags(WCAG_TAGS)
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test(`focus is visible on every control: ${name}`, async ({ page }) => {
    await page.goto(path);
    await ready?.(page);

    const focusedControls: string[] = [];
    const withoutRing: string[] = [];
    for (let tab = 0; tab < MAX_TABS; tab++) {
      await page.keyboard.press("Tab");
      const focused = await page.evaluate(() => {
        const element = document.activeElement;
        if (element === null || element === document.body) {
          return null;
        }
        const { outlineStyle, outlineWidth } = getComputedStyle(element);
        return {
          description: `${element.tagName.toLowerCase()} "${element.textContent?.trim() || element.getAttribute("aria-label") || ""}"`,
          hasRing:
            outlineStyle !== "none" && Number.parseFloat(outlineWidth) >= 2,
        };
      });
      if (focused === null) {
        break;
      }
      focusedControls.push(focused.description);
      if (!focused.hasRing) {
        withoutRing.push(focused.description);
      }
    }

    // Every page has at least the skip link and the header's links.
    expect(focusedControls.length).toBeGreaterThan(3);
    expect(withoutRing).toEqual([]);
  });
}
