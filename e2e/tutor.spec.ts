import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { es } from "@/content/es";
import { waitForFrames } from "./support";

const { tutor, questions } = es.gravitation;

// Spec 03, G8: WCAG 2.1 levels A and AA.
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];
// Spec 04, Decision 15: the floating card from 1,280 px, the sheet below.
const FLOATING_PANEL_PX = 384;
const FLOATING_PANEL_MAX_PX = 448;
// Spec 04, Decision 15: the card is min(28 rem, viewport − 14 rem) tall.
const VIEWPORT_MARGIN_PX = 224;
const EDGE_PX = 16;
const SHEET_MAX_PX = 384;
const SHEET_SHARE = 0.4;

const WIDE = { width: 1280, height: 800 };
const PHONE = { width: 360, height: 740 };
const TABLET = { width: 1024, height: 768 };
const PORTRAIT_TABLET = { width: 768, height: 1024 };
// A short laptop screen: the card must still leave page above it.
const SHORT_LAPTOP = { width: 1280, height: 720 };

function tutorOf(page: Page) {
  return {
    toggle: page.getByRole("button", { name: tutor.toggle }),
    panel: page.getByRole("dialog", { name: tutor.title }),
    close: page.getByRole("button", { name: tutor.close }),
  };
}

/** The lesson, hydrated, with the tutor's panel open. */
async function openTutor(page: Page) {
  const { toggle, panel, close } = tutorOf(page);
  await expect(toggle).toBeEnabled();
  await toggle.click();
  await expect(panel).toBeVisible();
  return { toggle, panel, close };
}

async function boxOf(page: Page, selector: Parameters<Page["locator"]>[0]) {
  const box = await page.locator(selector).first().boundingBox();
  if (box === null) {
    throw new Error(`${selector} has no box`);
  }
  return box;
}

for (const viewport of [PHONE, WIDE]) {
  test.describe(`at ${viewport.width} px`, () => {
    test.use({ viewport });

    test("the tutor button opens the panel and the page stays usable", async ({
      page,
    }) => {
      await page.goto("/gravitation");
      const { toggle } = await openTutor(page);

      await expect(toggle).toHaveAttribute("aria-expanded", "true");
      // Non-modal: the page beside or above the panel still answers.
      const falling = page.locator("#falling fieldset");
      await falling
        .getByRole("button", {
          name: questions["two-falls"].options.centre.label,
        })
        .click();
      await expect(falling.getByRole("status")).toContainText(
        es.gravitation.question.correct,
      );
    });

    test("Escape inside the panel closes it and focus returns to the toggle", async ({
      page,
    }) => {
      await page.goto("/gravitation");
      const { toggle, panel } = await openTutor(page);
      // Where opening puts focus depends on the width (spec 05, T10).
      await expect(panel.locator(":focus")).toHaveCount(1);

      await page.keyboard.press("Escape");

      await expect(panel).toBeHidden();
      await expect(toggle).toBeFocused();
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
    });

    test("the close button closes it and focus returns to the toggle", async ({
      page,
    }) => {
      await page.goto("/gravitation");
      const { toggle, panel, close } = await openTutor(page);

      await close.click();

      await expect(panel).toBeHidden();
      await expect(toggle).toBeFocused();
    });

    test("Escape on the page leaves the panel open", async ({ page }) => {
      await page.goto("/gravitation");
      const { panel } = await openTutor(page);

      await page.locator("#falling fieldset button").first().focus();
      await page.keyboard.press("Escape");

      await expect(panel).toBeVisible();
    });

    test("the toggle stays visible while the panel is open", async ({
      page,
    }) => {
      await page.goto("/gravitation");
      const { toggle, panel } = await openTutor(page);

      await expect(toggle).toBeInViewport();
      const toggleBox = await toggle.boundingBox();
      const panelBox = await panel.boundingBox();
      if (toggleBox === null || panelBox === null) {
        throw new Error("the toggle and the panel need boxes");
      }
      const overlaps =
        toggleBox.x < panelBox.x + panelBox.width &&
        panelBox.x < toggleBox.x + toggleBox.width &&
        toggleBox.y < panelBox.y + panelBox.height &&
        panelBox.y < toggleBox.y + toggleBox.height;
      expect(overlaps).toBe(false);
    });

    test("no axe violations with the panel open", async ({ page }) => {
      await page.goto("/gravitation");
      await openTutor(page);

      const results = await new AxeBuilder({ page })
        .withTags(WCAG_TAGS)
        .analyze();

      expect(results.violations).toEqual([]);
    });
  });
}

for (const viewport of [WIDE, SHORT_LAPTOP]) {
  test(`from 1,280 px the panel floats at the bottom right, above the toggle, at ${viewport.width} × ${viewport.height} px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/gravitation");
    const { toggle, panel } = await openTutor(page);

    const panelBox = await panel.boundingBox();
    const toggleBox = await toggle.boundingBox();
    if (panelBox === null || toggleBox === null) {
      throw new Error("the panel and the toggle need boxes");
    }
    expect(panelBox.width).toBe(FLOATING_PANEL_PX);
    expect(panelBox.x + panelBox.width).toBe(viewport.width - EDGE_PX);
    expect(panelBox.y + panelBox.height).toBeLessThanOrEqual(toggleBox.y);
    expect(panelBox.height).toBeCloseTo(
      Math.min(FLOATING_PANEL_MAX_PX, viewport.height - VIEWPORT_MARGIN_PX),
      0,
    );
  });
}

test("opening and closing the panel does not move the page", async ({
  page,
}) => {
  await page.setViewportSize(WIDE);
  await page.goto("/gravitation#moon");
  const heading = page.locator("#moon h2");
  const place = async () => {
    const box = await heading.boundingBox();
    return {
      y: box?.y,
      scrollY: await page.evaluate(() => Math.round(scrollY)),
    };
  };
  const before = await place();

  const { toggle } = await openTutor(page);
  const opened = await place();
  await toggle.click();
  const closed = await place();

  expect(opened).toEqual(before);
  expect(closed).toEqual(before);
});

for (const viewport of [PHONE, PORTRAIT_TABLET, TABLET]) {
  test(`below 1,280 px the panel is a bottom sheet and the page above stays visible, at ${viewport.width} px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/gravitation");
    const { panel } = await openTutor(page);

    const box = await panel.boundingBox();
    if (box === null) {
      throw new Error("the panel has no box");
    }
    const height = Math.min(viewport.height * SHEET_SHARE, SHEET_MAX_PX);
    expect(box.x).toBe(0);
    expect(box.width).toBe(viewport.width);
    expect(box.y + box.height).toBeCloseTo(viewport.height, 0);
    expect(box.height).toBeCloseTo(height, 0);
    await expect(
      page.getByRole("heading", { level: 1, name: es.gravitation.title }),
    ).toBeInViewport();
  });
}

for (const viewport of [PHONE, WIDE]) {
  test(`with the panel open, the end of the last part scrolls above it, at ${viewport.width} px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/gravitation");
    const { panel } = await openTutor(page);

    await page.evaluate(() =>
      scrollTo({ top: document.documentElement.scrollHeight }),
    );
    await waitForFrames(page, 2);

    const lastQuestion = await boxOf(page, "#law fieldset");
    const covering = await panel.boundingBox();
    if (covering === null) {
      throw new Error("the panel has no box");
    }
    expect(lastQuestion.y + lastQuestion.height).toBeLessThanOrEqual(
      covering.y,
    );
  });
}
