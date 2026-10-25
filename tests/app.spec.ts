import { test, expect } from "@playwright/test";
test("notes persist, move, undo and transfer without sending work", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator(".pin-note")).toHaveCount(3);
  await page.locator("#new-note").click();
  await page.locator("#note-title").fill("Build a calmer inbox");
  await page
    .locator("#note-body")
    .fill("Separate urgent tasks from thoughts that can wait.");
  await expect(
    page.locator(".pin-note h3").filter({ hasText: "Build a calmer inbox" }),
  ).toHaveCount(1);
  await page.reload();
  await expect(page.locator(".pin-note")).toHaveCount(4);
  const note = page
    .locator(".pin-note")
    .filter({ hasText: "Build a calmer inbox" });
  await note.locator(".note-read").click();
  await page.locator("#delete-note").click();
  await expect(page.locator(".pin-note")).toHaveCount(3);
  await page.locator("#undo").click();
  await expect(page.locator(".pin-note")).toHaveCount(4);
  await page.locator("#import-board").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":99}'),
  });
  await expect(page.locator("#status")).toContainText("version 2");
  expect(errors).toEqual([]);
  const d = page.waitForEvent("download");
  await page.locator("#export-board").click();
  expect((await d).suggestedFilename()).toBe("afterthought-board.json");
});
test("diagram blocks, directed links, forms and SVG export work", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator('[data-mode="diagram"]').click();
  await page.locator("#add-block").click();
  await page.locator("#block-label").fill("Browser");
  await page.locator("#add-block").click();
  await page.locator("#block-label").fill("Worker");
  const ids = await page.evaluate(() =>
    (window as any).afterthought.board.diagram.nodes.map((n: any) => n.id),
  );
  await page.locator("#connect-blocks").click();
  await page.locator(`[data-node="${ids[0]}"]`).click();
  await page.locator(`[data-node="${ids[1]}"]`).click();
  expect(
    await page.evaluate(
      () => (window as any).afterthought.board.diagram.edges.length,
    ),
  ).toBe(1);
  await page.locator("#connect-blocks").click();
  await page.locator(`[data-node="${ids[1]}"]`).click();
  await page.locator("#block-shape").selectOption("database");
  await page.locator('[data-nudge="20,0"]').click();
  await page.reload();
  await page.locator('[data-mode="diagram"]').click();
  await expect(page.locator("#diagram [data-node]")).toHaveCount(2);
  await expect(page.locator("#diagram [data-edge]")).toHaveCount(1);
  const d = page.waitForEvent("download");
  await page.locator("#diagram-svg").click();
  expect((await d).suggestedFilename()).toBe("afterthought-diagram.svg");
});
test("whiteboard ink, erasing, undo, expand and reload preserve actual strokes", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator('[data-mode="whiteboard"]').click();
  const box = (await page.locator("#ink").boundingBox())!;
  await page.mouse.move(box.x + 60, box.y + 70);
  await page.mouse.down();
  await page.mouse.move(box.x + 210, box.y + 150, { steps: 15 });
  await page.mouse.up();
  await expect(page.locator("#ink-count")).toHaveText("1 STROKES");
  await page.locator("#clear-ink").click();
  await expect(page.locator("#ink-count")).toHaveText("0 STROKES");
  await page.locator("#undo").click();
  await expect(page.locator("#ink-count")).toHaveText("1 STROKES");
  await page.reload();
  await page.locator('[data-mode="whiteboard"]').click();
  await expect(page.locator("#ink-count")).toHaveText("1 STROKES");
  await page.locator("#eraser").click();
  const p = await page.evaluate(
    () => (window as any).afterthought.board.strokes[0].points[5],
  );
  const paper = (await page.locator("#ink").boundingBox())!;
  await page.mouse.click(
    paper.x + (p.x * paper.width) / 1100,
    paper.y + (p.y * paper.height) / 1600,
  );
  await expect(page.locator("#ink-count")).toHaveText("0 STROKES");
  await page.locator("#undo").click();
  await expect(page.locator("#ink-count")).toHaveText("1 STROKES");
  await page.locator("#focus-ink").click();
  await expect(page.locator("#ink-shell")).toHaveClass(/expanded/);
  await page.locator("#focus-ink").click();
  const d = page.waitForEvent("download");
  await page.locator("#ink-png").click();
  expect((await d).suggestedFilename()).toBe("afterthought-whiteboard.png");
});
test("touch and pressure samples are handled and mobile layout fits", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.locator('[data-mode="whiteboard"]').click();
  await page.locator("#ink").evaluate((canvas: HTMLCanvasElement) => {
    const r = canvas.getBoundingClientRect();
    for (const [type, x, pressure] of [
      ["pointerdown", 40, 0.2],
      ["pointermove", 100, 0.8],
      ["pointerup", 130, 0],
    ] as const)
      canvas.dispatchEvent(
        new PointerEvent(type, {
          pointerId: 12,
          pointerType: "pen",
          clientX: r.x + x,
          clientY: r.y + 80,
          pressure,
          bubbles: true,
        }),
      );
  });
  await expect(page.locator("#ink-count")).toHaveText("1 STROKES");
  const pressures = await page.evaluate(() =>
    (window as any).afterthought.board.strokes[0].points.map((p: any) => p.p),
  );
  expect(pressures[0]).toBeCloseTo(0.2, 5);
  expect(pressures.some((p: number) => Math.abs(p - 0.8) < 1e-5)).toBe(true);
  await page.locator("#touch-draw").uncheck();
  await page.locator("#ink").evaluate((c: HTMLCanvasElement) =>
    c.dispatchEvent(
      new PointerEvent("pointerdown", {
        pointerId: 13,
        pointerType: "touch",
        clientX: 40,
        clientY: 80,
        bubbles: true,
      }),
    ),
  );
  await expect(page.locator("#ink-count")).toHaveText("1 STROKES");
});
test("a fresh installation stays disconnected and never fabricates a response", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator(".note-read").first().click();
  await page.locator("#ask-agent").click();
  await expect(page.locator("#setup-dialog")).toBeVisible();
  await page.route("**/agent/health", (r) =>
    r.fulfill({
      json: {
        connected: false,
        configured: false,
        token: "contract-token",
        message: "No gateway configured.",
      },
    }),
  );
  await page.locator("#connect-agent").click();
  await expect(page.locator("#connection-message")).toContainText(
    "No gateway configured",
  );
  await expect(page.locator(".agent-reply")).toHaveCount(0);
});
test("explicit run contract pins one reply, survives reload and preserves terminal status", async ({
  page,
}) => {
  let polls = 0,
    submitted = 0;
  await page.route("**/agent/health", (r) =>
    r.fulfill({
      json: {
        connected: true,
        token: "contract-token",
        message: "TEST CONTRACT FIXTURE — not a live Hermes run",
      },
    }),
  );
  await page.route("**/agent/runs", (r) => {
    submitted++;
    return r.fulfill({
      status: 202,
      json: { run_id: "run_contract", status: "started" },
    });
  });
  await page.route("**/agent/runs/run_contract", (r) => {
    polls++;
    return r.fulfill({
      json: {
        status: polls === 1 ? "running" : "completed",
        output:
          polls === 1
            ? ""
            : "TEST CONTRACT FIXTURE — agent text returned through the API contract.",
      },
    });
  });
  await page.goto("/");
  await page.locator("#setup").click();
  await page.locator("#connect-agent").click();
  await page.locator(".dialog-close").click();
  await page.locator(".note-read").first().click();
  await page.locator("#ask-agent").click();
  await expect(page.locator("#task-state")).toContainText(
    /RUNNING|QUEUED|REPLY READY/,
  );
  await page.reload();
  await expect(page.locator(".agent-reply")).toHaveCount(1, { timeout: 10000 });
  await page.reload();
  await expect(page.locator(".agent-reply")).toHaveCount(1);
  expect(submitted).toBe(1);
});
