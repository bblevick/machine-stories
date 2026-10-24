import { test, expect } from "@playwright/test";
test("mechanisms, controls, export, and reset", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("#stage canvas")).toBeVisible();
  await expect(page.locator("#loading")).toBeHidden();
  await page.getByRole("button", { name: "02 Crank" }).click();
  await expect(page.locator("#mechanism-name")).toHaveText("Slider–crank");
  await page.locator("#radius").fill("1");
  await page.locator("#explode").fill("1");
  await expect(page.locator("#explode-value")).toHaveText("100%");
  await page.getByRole("button", { name: "03 Belt" }).click();
  await expect(page.locator("#parts button")).toHaveCount(3);
  await page.locator("#guide").click();
  await page.evaluate(() => {
    (window as any).machineStories.guideAt(11000);
  });
  await expect(page.locator("#explode-value")).toHaveText("100%");
  const download = page.waitForEvent("download");
  await page.locator("#capture").click();
  expect((await download).suggestedFilename()).toContain(".png");
  await page.locator("#reset").click();
  await expect(page.locator("#mechanism-name")).toHaveText("Spur gears");
  await expect(page.locator("#phase")).toHaveValue("0");
  expect(errors).toEqual([]);
});
test("narrow layout fits the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("tour completion restores controls and real playback advances", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.locator("#guide").click();
  await page.evaluate(() => (window as any).machineStories.guideAt(19990));
  await page.locator("#play").click();
  await expect(page.locator("#chapter")).toContainText("Tour complete");
  await expect(page.locator("#explode")).toBeEnabled();
  await expect(page.locator("#phase")).toBeEnabled();
  const before = await page.evaluate(
    () => (window as any).machineStories.state.phase,
  );
  await page.locator("#play").click();
  await expect
    .poll(() => page.evaluate(() => (window as any).machineStories.state.phase))
    .toBeGreaterThan(before);
});

test("the circular mailroom carries the visitor’s actual note", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#case-note").fill("A beautifully unfinished idea.");
  await page.locator("#file-note").click();
  await expect(page.locator("#case-name")).toHaveText("The Circular Mailroom");
  expect(
    await page.evaluate(() => (window as any).machineStories.state.memo),
  ).toBe("A beautifully unfinished idea.");
});
