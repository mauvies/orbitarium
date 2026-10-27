import { expect, test } from "@playwright/test";
import { es } from "@/content/es";

// Spec 03, G9: a phone, a tablet and a laptop.
const VIEWPORTS = [
  { width: 360, height: 740, galleryColumns: 1 },
  { width: 768, height: 1024, galleryColumns: 2 },
  { width: 1280, height: 800, galleryColumns: 3 },
] as const;

// WCAG 2.2, 2.5.8: the smallest pointer target.
const MIN_TARGET_PX = 24;

const PAGES = [
  { name: "home", path: "/" },
  { name: "lesson", path: "/gravitation" },
  { name: "gallery", path: "/three-body" },
  { name: "detail", path: "/three-body/butterfly-i" },
] as const;

for (const { width, height, galleryColumns } of VIEWPORTS) {
  test.describe(`at ${width} px`, () => {
    test.use({ viewport: { width, height } });

    for (const { name, path } of PAGES) {
      test(`no horizontal scroll: ${name}`, async ({ page }, testInfo) => {
        await page.goto(path);

        const overflow = await page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        );

        // For the visual review (spec 03, Decision 13), not compared.
        await testInfo.attach(`${name}-${width}`, {
          body: await page.screenshot({ fullPage: true }),
          contentType: "image/png",
        });
        expect(overflow).toBe(0);
      });
    }

    test(`the gallery grid has ${galleryColumns} columns`, async ({ page }) => {
      await page.goto("/three-body");
      const cards = page.getByRole("main").getByRole("listitem");
      await expect(cards).not.toHaveCount(0);

      const lefts = await cards.evaluateAll((items) =>
        items.map((item) => Math.round(item.getBoundingClientRect().left)),
      );

      expect(new Set(lefts).size).toBe(galleryColumns);
    });

    // Spec 04, L15: every control of the lesson, the tutor's toggle included.
    test("lesson controls stay inside the viewport, apart, with 24 px targets", async ({
      page,
    }) => {
      await page.goto("/gravitation");
      await expect(
        page.getByRole("button", { name: es.gravitation.tutor.toggle }),
      ).toBeEnabled();
      // A checkbox's target is its label, which takes the clicks too.
      const targets = await page
        .locator("button:visible, input:visible, select:visible")
        .evaluateAll((elements) =>
          elements.map((element) => {
            const clickable =
              element instanceof HTMLInputElement && element.type === "checkbox"
                ? (element.labels?.[0] ?? element)
                : element;
            const box = clickable.getBoundingClientRect();
            return {
              name:
                element.getAttribute("aria-label") ??
                clickable.textContent?.trim() ??
                element.id,
              left: box.left,
              right: box.right,
              top: box.top,
              bottom: box.bottom,
              width: box.width,
              height: box.height,
            };
          }),
        );
      expect(targets).not.toHaveLength(0);

      const problems = targets.flatMap((target) => [
        ...(target.left < 0 || target.right > width
          ? [`${target.name} leaves the viewport`]
          : []),
        ...(target.width < MIN_TARGET_PX || target.height < MIN_TARGET_PX
          ? [
              `${target.name} is ${Math.round(target.width)} × ${Math.round(target.height)} px`,
            ]
          : []),
      ]);
      for (const [i, first] of targets.entries()) {
        for (const second of targets.slice(i + 1)) {
          if (
            first.left < second.right &&
            second.left < first.right &&
            first.top < second.bottom &&
            second.top < first.bottom
          ) {
            problems.push(`${first.name} overlaps ${second.name}`);
          }
        }
      }
      expect(problems).toEqual([]);
    });

    test("detail controls stay inside the viewport with 24 px targets", async ({
      page,
    }) => {
      await page.goto("/three-body/butterfly-i");
      const controls = page.getByRole("group", {
        name: es.detail.player.controls,
      });
      // A button's target is itself; a radio's or a checkbox's is its label,
      // which takes the clicks too.
      const targets = await controls
        .locator("button, label")
        .evaluateAll((elements) =>
          elements.map((element) => {
            const box = element.getBoundingClientRect();
            return {
              text: element.textContent?.trim() ?? "",
              left: box.left,
              right: box.right,
              width: box.width,
              height: box.height,
            };
          }),
        );
      expect(targets).not.toHaveLength(0);

      for (const target of targets) {
        expect.soft(target.left, target.text).toBeGreaterThanOrEqual(0);
        expect.soft(target.right, target.text).toBeLessThanOrEqual(width);
        expect
          .soft(target.width, target.text)
          .toBeGreaterThanOrEqual(MIN_TARGET_PX);
        expect
          .soft(target.height, target.text)
          .toBeGreaterThanOrEqual(MIN_TARGET_PX);
      }
    });
  });
}
