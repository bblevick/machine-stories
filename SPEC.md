# Afterthought v2 — a personal board for ideas and Hermes tasks

## Product and design

Replace the machine exhibit with an original corkboard notebook and a real Hermes gateway frontend. Three modes: corkboard, diagram, portrait whiteboard. Design thesis: a quiet analog studio for unfinished thoughts. Cream/forest/rust; cork grain and paper edges; serif ideas against small archival labels. Signature: a real returned agent response pinned beside a thought. Avoid a generic chat box or fake progress/replies.

## Data contracts

`Board` version 2: ID/title, notes, diagram nodes/edges, strokes, updatedAt. `Note`: ID/title/body/color/x/y/rotation/kind, optional source/run receipt and AgentTask. `AgentTask`: immutable sent input, random idempotency key, run ID/status, timestamps and error. `DiagramNode`: label/detail/shape/x/y; `DiagramEdge`: source/destination/label. `Stroke`: color/width and normalized pressure points in a fixed 1100×1600 page.

All calculation/state validation in `model.ts`, rendering in `drawing.ts`, interface/pointer/storage/bridge client in `main.ts`. No application framework. HTML native inputs, SVG vectors, Canvas ink. Old exhibit recoverable from Git history; Three.js is no longer a runtime dependency.

## Notebook behavior

80 notes; create/edit/move/color/remove, 20-snapshot undo/redo, browser autosave and explicit JSON export/import (3 MB). No cloud sync or automatic uploads. Note source text and completed response text stay separate. Initial content clearly labeled Starter note. PNG summary export; editable JSON is authoritative. Clear errors for quota/corrupt input; never inject untrusted HTML.

Diagram: 50 blocks, 100 directed labeled links, process/decision/database/frame shapes, architecture and storyboard starters only for empty canvas, drag and keyboard form/nudge controls. Remove nodes with incident links. Native SVG download.

Whiteboard: 500 strokes and 100,000 points total; pressure + coalesced events, single active pointer, reject unrelated touch during pen input, disable-touch option, incremental ink rendering, whole-stroke eraser, undo, ink color/weight, PNG and expanded portrait page. Cancel/blur finishes the active stroke. No OCR; attachments are coordinates. No assertion of real iPad/Pencil testing.

## Hermes integration

Optional local Node bridge on 127.0.0.1:8766; Vite notebook at 4198. Fresh install is disconnected. `.env.local` holds HERMES_URL (loopback only) and HERMES_API_KEY (never VITE_, client storage, exports or source). Setup points to official installer/provider configuration/API enablement. No automatic installation, paid provider use or execution. Hosted demo has no loopback access or agent simulation.

Bridge allows GET health, POST runs, GET run status, POST run stop. Host allowlist; mutations require expected local Origin, JSON and random bridge token. Upstream credential is server-side. Payload cap 450 KB; input 100,000 chars; 20 s forwarding timeout, no automatic execution retry, no redirects. Idempotency key forwarded to Hermes. Current API reference: https://hermes-agent.nousresearch.com/docs/user-guide/features/api-server .

Send only selected note plus explicitly checked diagram/strokes. Save request snapshot before submission. Poll actual run receipt every 2.5 seconds when visible/connected. Reconnect resumes receipt polling; a missing creation receipt uses explicit recovery with the same key/input. Completed nonempty output pins one linked reply per run ID, at most 20,000 chars. Partial/incomplete output labeled partial. Cancelled/failed/interrupted/unknown/approval/input/stopping statuses are preserved. A request to stop is not cancellation completion. Missing final text never becomes success. The board never answers approval or clarification controls automatically; use Hermes UI. Active run notes cannot be removed/import-replaced. Undo must preserve known run receipts. No guarantee beyond upstream retention/idempotency semantics.

## Acceptance and boundaries

Type checking, six board-model tests, five actual local HTTP bridge contract tests, six scenarios in Chromium/WebKit (12 runs), responsive layout, keyboard forms, explicit synthetic pressure fixture, real disconnected bridge check, production repository-path check, clean clone build, current screenshots and 50-second walkthrough, public Pages verification. A configured Hermes provider is absent on this machine: actual model/tool execution is a remaining setup dependency, not an established test result.
