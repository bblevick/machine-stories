# Build log

## 2026-10-24 — initial implementation

- User approved the three-project creative portfolio, local/free runtime, TypeScript/Vite stack, fully specified tickets, and selective runtime AI.
- Codex implemented the application in this repository, separating calculations/control mapping from rendering and browser orchestration.
- Used Node 24.22.1 LTS, committed exact dependency resolutions, and added checks and GitHub Pages deployment.
- Formatted source modules for maintainability; no shared framework, backend, or agent orchestration layer.
- Captured actual interface screenshots, a scripted browser demonstration, and a bounded frame-scheduling sample on the M4 / 24 GB development machine.

## Verification findings and corrections

- The demonstration recorder exposed manual controls remaining disabled at the end of a guided tour. Completion now restores them; a browser regression also checks that real playback advances.
- Replaced a removed Three.js soft-shadow constant with the supported shadow mode.
- Native Safari exercised mechanism switching, separated view, and keyboard-accessible part inspection.

## Evidence boundaries

Automated Chromium/WebKit checks, native Safari control checks, and user-reported device checks are distinct. Performance JSON is a 120-frame headless scheduling sample, not an end-to-end latency measurement. Public deployment status is recorded after publication in docs/VERIFICATION.md.

## 2026-10-24 — user-directed originality revision

File an unfinished thought into a mechanical mailroom that sends it precisely nowhere.

Implemented the interaction described in the README, updated the visual identity, and added a browser regression for the new behavior. The two additional portfolio projects were explicitly requested by the user.

## October 24, 2026 — Afterthought, user-directed replacement

Ben requested a corkboard of personal brain dumps and sticky notes with a Hermes agent responding onto the board, plus architecture/storyboard and tablet whiteboard modes. He confirmed Hermes is not yet installed and asked for the integration/setup to be built for it. Replaced the exhibit UI; removed unused Three.js code/dependencies, preserving the original version in Git history.

Implemented local board transfer/undo, original cork/paper styling, editable SVG diagrams, portrait freehand ink, single-pointer pressure/coalescing handling and incremental stroke drawing. Browser testing found untrusted synthetic pointer capture lacks a native capture target, and pressure is represented as float32. Fixture handling and precision checks now reflect those facts. Mouse ink, erasing, storage and redraw are exercised separately.

Used official Hermes Runs API for asynchronous receipt/reconciliation instead of treating interim text as completion. Added loopback server-side credential bridge, explicit selected context, immutable idempotency input, retry/recovery, response dedup, and distinct failed/unknown/partial/cancelled states. Actual disconnected bridge was checked with no Hermes installed. Five HTTP contract tests and six pure state cases passed; twelve Chromium/WebKit scenarios passed. These do not establish real configured Hermes execution or physical Pencil behavior.
