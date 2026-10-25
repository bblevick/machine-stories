import { chromium } from "@playwright/test";
import { spawn, spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
if (spawnSync("ffmpeg", ["-version"], { stdio: "ignore" }).status !== 0)
  throw Error("Install FFmpeg and ensure it is on PATH.");
await mkdir(".artifacts/demo", { recursive: true });
await mkdir("docs/media", { recursive: true });
const server = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "--host",
    "127.0.0.1",
    "--port",
    "4201",
    "--strictPort",
  ],
  { stdio: "ignore" },
);
let browser, context;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch("http://127.0.0.1:4201")).ok) break;
    } catch {}
    await wait(100);
    if (i === 99) throw Error("Demo server failed to start.");
  }
  browser = await chromium.launch({ channel: "chromium", headless: true });
  context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    recordVideo: { dir: ".artifacts/demo", size: { width: 1280, height: 900 } },
  });
  const page = await context.newPage(),
    video = page.video(),
    start = performance.now();
  await page.goto("http://127.0.0.1:4201");
  await page.waitForFunction(() => Boolean(window.afterthought));
  await wait(1500);
  await page.locator(".note-read").first().click();
  await page.locator("#note-title").fill("A little less noise.");
  await page
    .locator("#note-body")
    .fill(
      "An inbox that feels like a workbench. What deserves my attention? What can wait here?",
    );
  await page.locator('[data-color="blue"]').click();
  await page.locator(".workspace").first().scrollIntoViewIfNeeded();
  await wait(4000);
  await page.locator('[data-mode="diagram"]').click();
  await page.locator("#architecture").click();
  await wait(4000);
  await page.locator("#block-label").fill("A calmer interface");
  await page
    .locator("#block-detail")
    .fill("Capture a thought before it disappears.");
  await wait(3500);
  await page.locator('[data-mode="whiteboard"]').click();
  await page.locator("#ink").scrollIntoViewIfNeeded();
  const box = await page.locator("#ink").boundingBox();
  for (const points of [
    [
      [130, 120],
      [350, 120],
      [350, 270],
      [130, 270],
      [130, 120],
    ],
    [
      [390, 195],
      [650, 195],
    ],
    [
      [620, 165],
      [650, 195],
      [620, 225],
    ],
    [
      [700, 120],
      [960, 120],
      [960, 270],
      [700, 270],
      [700, 120],
    ],
    [
      [160, 420],
      [350, 470],
      [520, 430],
      [700, 510],
      [930, 460],
    ],
  ]) {
    await page.mouse.move(
      box.x + (points[0][0] * box.width) / 1100,
      box.y + (points[0][1] * box.height) / 1600,
    );
    await page.mouse.down();
    for (const [x, y] of points.slice(1))
      await page.mouse.move(
        box.x + (x * box.width) / 1100,
        box.y + (y * box.height) / 1600,
        { steps: 12 },
      );
    await page.mouse.up();
  }
  await wait(4500);
  await page.locator("#focus-ink").click();
  await wait(4000);
  await page.locator("#focus-ink").click();
  await page.locator("#setup").click();
  await wait(7000);
  await page.locator(".dialog-close").click();
  await page.locator('[data-mode="board"]').click();
  await wait(4000);
  await wait(Math.max(0, 51000 - (performance.now() - start)));

  await context.close();
  context = null;
  const source = await video.path();
  const result = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-i",
      source,
      "-t",
      "50",
      "-r",
      "30",
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-crf",
      "21",
      "-pix_fmt",
      "yuv420p",
      "-an",
      "-movflags",
      "+faststart",
      "docs/media/demo.mp4",
    ],
    { encoding: "utf8" },
  );
  if (result.status !== 0) throw Error(result.stderr);
  console.log("Created docs/media/demo.mp4 (50 seconds).");
} finally {
  await context?.close();
  await browser?.close();
  server.kill();
}
