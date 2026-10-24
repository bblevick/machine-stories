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
  await page.waitForFunction(() => Boolean(window.machineStories));
  await wait(1800);
  await page.locator("#case-note").fill("A beautifully unfinished idea.");
  await page.locator("#file-note").click();
  await page.locator(".exhibit").scrollIntoViewIfNeeded();
  await wait(6500);
  await page.locator("#explode").fill("1");
  await wait(5000);
  await page.locator("#explode").fill("0");
  await page.locator('[data-id="gears"]').click();
  await page.locator("#guide").click();
  await wait(20500);
  await page.locator('[data-id="crank"]').click();
  await page.locator("#play").click();
  await wait(4500);
  await page.locator("#radius").fill("1");
  await wait(3000);
  await page.locator('[data-id="belt"]').click();
  await wait(3500);
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
