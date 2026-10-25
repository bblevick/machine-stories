# Afterthought v2 bounded tickets

Implement the next uncompleted ticket. Read SPEC.md and existing code. Preserve the model/run contracts and locked dependencies. Run actual checks and distinguish contract fixtures from live execution. Never substitute canned replies for a missing agent.

- [x] B1 — Bounded board model, local persistence, import validation and undo snapshots. Check `npm test` on transfer, invalid geometry and independent copies.
- [x] B2 — Original corkboard: sticky notes, movable pins, editing, colors, selection, exports and responsive forms. Check `npm run test:e2e` for notes/reload/undo.
- [x] B3 — Native SVG architecture/storyboard tool, labels, directed links, templates, dragging and keyboard editing. Check `npm run test:e2e` and SVG export.
- [x] B4 — Portrait freehand ink, pressure/coalesced samples, single active pen/touch pointer, vector eraser, incremental draw, undo/export and expand. Check `npm run test:e2e`; synthetic pressure is not physical iPad verification.
- [x] B5 — Real Hermes Runs API bridge and setup guide, server-held credentials, explicit submission/context, idempotency recovery, receipt polling/reply dedup and honest terminal states. Check `npm run test:bridge && npm test`; external model execution needs user configuration.
- [ ] B6 — Current media, documentation, clean clone/type/unit/bridge/browser/build checks, production path, public deployment and verified live URL. `npm run typecheck && npm test && npm run test:bridge && npm run test:e2e && BASE_PATH=/machine-stories/ npm run build`; `npm run demo:capture`.

Fresh-machine follow-up after user installs/configures Hermes: connect, submit a harmless note, verify the actual gateway receipt and pinned final response, reload, and confirm no duplicate run or reply. This is a setup-dependent verification item, not a fake completed run.
