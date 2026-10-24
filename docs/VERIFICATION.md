# Verification — October 24, 2026

## Local checks

- Node 24.22.1 LTS on Apple M4 / 24 GB RAM.
- `npm run typecheck`: passed.
- `npm test`: 5 tests passed.
- `npm run test:e2e`: 8 checks passed across actual Chromium and Playwright WebKit. WebKit compatibility checks are distinct from native Safari checks.
- `BASE_PATH=/machine-stories/ npm run build`: passed.
- Built-site repository-path smoke evidence: [production-path-check.json](production-path-check.json). It records missing responses, page errors, and external requests.
- Screenshots visually inspected at desktop width; browser checks include a 390-pixel viewport without horizontal overflow.
- Native Safari local-development controls exercised: Mechanism switching, separated view, part inspection.
- Three interface screenshots and a 50-second MP4 walkthrough are included. [Media manifest](media-manifest.json) records actual video dimensions, duration and frames.
- [performance.json](performance.json) records a 120-frame headless scheduling sample with its context. It is not a camera or interaction latency benchmark.

## Specific acceptance

Gear ratios, slider endpoints/rod length, equal pulley motion, and belt continuity are covered by unit tests. A regression verifies tour completion restores manual controls and ordinary playback advances. PNG export triggers a browser download.

## Material limits

Three.js produces a 600 KB uncompressed application bundle (~153 KB gzip). Vite reports the size; it is accepted for the 3D exhibit rather than hiding the warning.

The demonstration videos are scripted recordings of the actual apps. Air Orchestra’s demo mode is explicitly prerecorded control data and its video does not imply live camera detection.

## Release verification

Public deployment and clean-checkout verification are recorded after publication. No employer or hiring outcome is implied by these checks.

Clean-checkout verification: a fresh local Git clone passed `npm ci`, type checking, unit checks, production build with the repository base path, and the full Chromium/WebKit browser suite. The base-path preview exercised real interactions and bundled model assets with no page errors, HTTP failures, or external application requests. See `production-path-check.json`.
