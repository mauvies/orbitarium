import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, test } from "@playwright/test";
import { es } from "@/content/es";
import { orbits } from "@/orbits";

// Spec 03, G8: WCAG 2.1 levels A and AA.
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

const { tutor } = es.gravitation;

// The longest a page's tab order runs before focus leaves the document. The
// lesson, the longest, has 40 tab stops at 360 and at 1,280 px.
const MAX_TABS = 60;

type CheckedPage = {
  readonly name: string;
  readonly path: string;
  /** Waits until the page's controls are hydrated and can take focus. */
  readonly ready?: (page: Page) => Promise<void>;
};

const detailReady = (page: Page) =>
  expect(
    page.getByRole("button", { name: es.detail.player.restart }),
  ).toBeEnabled();

const PAGES: readonly CheckedPage[] = [
  { name: "the home page", path: "/" },
  { name: "the gallery", path: "/three-body" },
  ...orbits.map((orbit) => ({
    name: `the ${orbit.slug} page`,
    path: `/three-body/${orbit.slug}`,
    ready: detailReady,
  })),
  { name: "the lesson", path: "/gravitation" },
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

    const focusedControls = await tabUntilFocusLeaves(page);

    // Every page has at least the skip link and the header's links.
    expect(focusedControls.length).toBeGreaterThan(3);
    expect(withoutRing(focusedControls)).toEqual([]);
  });
}

test("focus is visible on every control of the tutor's panel, and Escape returns to the toggle", async ({
  page,
}) => {
  await page.route("**/api/tutor", (route) =>
    route.request().method() === "GET"
      ? route.fulfill({ json: { available: true } })
      : route.fulfill({
          status: 200,
          headers: {
            "content-type": "text/event-stream",
            "x-vercel-ai-ui-message-stream": "v1",
          },
          body: readFileSync(resolve("e2e/fixtures/tutor/answer.sse"), "utf8"),
        }),
  );
  await page.goto("/gravitation");
  const toggle = page.getByRole("button", { name: tutor.toggle });
  const panel = page.getByRole("dialog", { name: tutor.title });
  await expect(toggle).toBeEnabled();
  // «Nueva conversación» only appears once there is a message.
  await toggle.click();
  await page.getByRole("textbox", { name: tutor.input }).fill("¿Por qué?");
  await page.keyboard.press("Enter");
  await expect(
    panel.getByRole("button", { name: tutor.newConversation }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(toggle).toBeFocused();

  await page.keyboard.press("Enter");
  await expect(panel).toBeVisible();
  await toggle.focus();
  const focusedControls = await tabUntilFocusLeaves(page, panel);

  expect(focusedControls.map(({ description }) => description)).toEqual([
    `button "${tutor.newConversation}"`,
    `button "${tutor.close}"`,
    `section "${tutor.conversation}"`,
    `textarea "${tutor.input}"`,
    `button "${tutor.send}"`,
  ]);
  expect(withoutRing(focusedControls)).toEqual([]);

  // The last Tab left the panel; Escape closes it only from inside.
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Escape");

  await expect(panel).toBeHidden();
  await expect(toggle).toBeFocused();
});

type FocusedControl = {
  readonly description: string;
  readonly hasRing: boolean;
};

/** The control with focus, or null once focus has left the page. */
function focusedControl(page: Page): Promise<FocusedControl | null> {
  return page.evaluate(() => {
    const element = document.activeElement;
    if (element === null || element === document.body) {
      return null;
    }
    // The tutor's field shows focus on its form, as a light border doubled by
    // an outline, not as an accent ring on the text area (visual style, "Focus").
    const ringed =
      element instanceof HTMLTextAreaElement
        ? (element.closest("form") ?? element)
        : element;
    const name =
      element instanceof HTMLTextAreaElement
        ? element.labels[0]?.textContent
        : element.getAttribute("aria-label") || element.textContent?.trim();
    const { outlineStyle, outlineWidth, borderTopWidth } =
      getComputedStyle(ringed);
    const thickness =
      Number.parseFloat(outlineWidth) +
      (ringed === element ? 0 : Number.parseFloat(borderTopWidth));
    return {
      description: `${element.tagName.toLowerCase()} "${name}"`,
      hasRing: outlineStyle !== "none" && thickness >= 2,
    };
  });
}

/**
 * Tabs from where focus is until it leaves the page, or `region` if given.
 * Fails if it has not left after `MAX_TABS`.
 */
async function tabUntilFocusLeaves(
  page: Page,
  region?: Locator,
): Promise<FocusedControl[]> {
  const focusedControls: FocusedControl[] = [];
  for (let tab = 0; tab < MAX_TABS; tab++) {
    await page.keyboard.press("Tab");
    const focused = await focusedControl(page);
    const outside =
      focused === null ||
      (region !== undefined && (await region.locator(":focus").count()) === 0);
    if (outside) {
      return focusedControls;
    }
    focusedControls.push(focused);
  }
  throw new Error(
    `Focus was still inside after ${MAX_TABS} tabs, at ${focusedControls.at(-1)?.description}; raise MAX_TABS`,
  );
}

function withoutRing(focusedControls: readonly FocusedControl[]): string[] {
  return focusedControls
    .filter(({ hasRing }) => !hasRing)
    .map(({ description }) => description);
}
