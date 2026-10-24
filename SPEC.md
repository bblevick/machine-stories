# Machine Stories — implementation specification

## Goal and audience

A recruiter can understand the result in 30 seconds, try it without an account, and inspect a reproducible, compact AI-assisted implementation. The application is a standalone static browser project; it uses no paid service or application backend.

## Required behavior

- Three procedural mechanisms: spur gears, slider–crank, and equal-pulley belt drive.
- Orbit and zoom, pause and cycle scrubbing, adjustable parameters, exploded views, and keyboard-accessible part inspection.
- A 20-second guided tour that returns control to the visitor, plus PNG export.

## Mechanism interface

`MechanismConfig` selects `gears | crank | belt`. Ratios are 1, 2, or 3; crank radius is 0.4–1; rod length is 1.5–3.5 and exceeds radius; pulley spacing is 2.2–4.5; speed is 0.25–2. Units are illustrative scene units. Phase is measured in input revolutions.

`sampleMechanism` returns named `{x, y, angle}` part poses, with angles in radians. Gear centers are separated by summed pitch radii. Driven angle is the negative input angle divided by ratio, plus a fixed assembly offset. Slider position is `r cos θ + sqrt(L² − r² sin² θ)`. Belt markers traverse two straight spans and two semicircles.

`Exhibit.renderAt(timeMs, viewState)` combines config, phase, exploded offset, and guided-tour state. Time is supplied through phase in `viewState`; render calls do not advance simulation. `window.machineStories` exposes deterministic capture helpers used by browser checks and media scripts.

## Controls

Space toggles play, arrows scrub, E toggles separation, and G starts the tour when focus is outside a control. Visible part buttons provide keyboard equivalents for clicking geometry. The Reset button restores the default gear exhibit and pauses it.

## Architecture and presentation

Controls → bounded mechanism config → analytical poses → procedural Three.js scene.

An engineering museum exhibit: ivory paper, graphite mechanisms, burnt-orange motion. Georgia display type contrasts with Trebuchet control labels. The signature element is a procedural machine that separates while retaining its analytical motion.

Keep logic, rendering, I/O, and interface orchestration separate. Use the exact locked dependencies. Test Chrome/Chromium first, WebKit for automated compatibility, and native Safari for visible control checks. Support keyboard focus, viewport resizing, visible errors, reset, and reduced motion. Only measured or directly verified behavior may be described as validated.

## Exclusions

Simplified educational geometry. Gear teeth are illustrative; no manufacturing tolerances, contact forces, CAD import, or physical collision solver. The gear pair returns to its complete joint pose after the larger gear’s ratio of input revolutions.

## Acceptance

Run type checking, unit tests, browser tests, and a production build. Verify project-base asset paths with the built output. Inspect three screenshots and a 50-second video. Record source/model notices and actual verification results. A public URL is considered live only after an HTTP check and a browser smoke check.

## Originality revision requested by the user

## The Bureau

The Patience Regulator, Second-Wind Engine, and Circular Mailroom turn analytical mechanisms into a small absurd office. Enter a note to place it on real moving 3D stationery. The note stays in browser memory and is not transmitted or saved by the application. Bellows geometry follows the slider; mail follows the full belt path. The metaphors are playful; the kinematics remain analytical.
