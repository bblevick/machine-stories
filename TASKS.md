# Machine Stories — bounded implementation tickets

## Instruction for the implementing model

Implement only the next uncompleted ticket. Read SPEC.md and existing code first. Preserve documented interfaces. Do not add out-of-scope features or dependencies. Run the ticket checks and relevant existing checks. Report changed behavior, evidence, and unresolved failures. Report a missing dependency or inconsistent specification explicitly; do not substitute simulated behavior for a required capability.

Tickets are ordered; each depends on the preceding ticket. Check marks record implemented work; release and device evidence are tracked separately in docs/VERIFICATION.md.

## [x] M1 — Analytical mechanism math

No browser dependency. Implement sampleMechanism(config, phase), config validation, and beltPoint. Verify reverse gear ratios, fixed connecting-rod length, stroke endpoints, equal pulley speed, and belt path continuity.

Verification: `npm test`.

## [x] M2 — Gear exhibit vertical slice

Build gear geometry once per config; drive transforms from absolute phase. Add orbit, zoom, pause, and cycle scrubbing. Verify no accumulated rotation drift.

Verification: `npm run typecheck && npm run test:e2e`.

## [x] M3 — Crank and belt geometry

Reuse the pose contract. Dispose geometry/materials when changing mechanisms. Advance belt markers along the entire closed path.

Verification: `npm test && npm run build`.

## [x] M4 — Part inspection and separation

Support raycast selection and equivalent part buttons. Apply exploded offsets independently from physical poses. Preserve the phase while inspecting.

Verification: `npm run test:e2e`.

## [x] M5 — Guided tour and PNG

Use guideAt for the 20-second chapter sequence. Restore enabled manual controls at completion. Capture the actual WebGL canvas.

Verification: `npm run test:e2e`.

## [x] M6 — Presentation and QA

Finish ivory/graphite/orange design, responsive layout, focus states, reduced-motion initial pause, screenshots, video, and native Safari control checks.

Verification: `npm run typecheck && npm test && npm run test:e2e && npm run build`.

## [x] Originality revision

## The Bureau

The Patience Regulator, Second-Wind Engine, and Circular Mailroom turn analytical mechanisms into a small absurd office. Enter a note to place it on real moving 3D stationery. The note stays in browser memory and is not transmitted or saved by the application. Bellows geometry follows the slider; mail follows the full belt path. The metaphors are playful; the kinematics remain analytical.

Verification: `npm run typecheck && npm run test:e2e && npm run build`.
