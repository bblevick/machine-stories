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
