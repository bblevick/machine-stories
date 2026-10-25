import "./style.css";
import { $, saveJSON } from "./utils";
import {
  createBoard,
  newNote,
  validateBoard,
  History,
  uid,
  now,
  taskInput,
  applyRun,
  diagramTemplate,
  notePosition,
  type Board,
  type Note,
  type Stroke,
  type DiagramNode,
} from "./board/model";
import {
  drawInk,
  drawStroke,
  hitsStroke,
  renderDiagram,
  boardImage,
  INK_W,
  INK_H,
} from "./board/drawing";
const STORAGE = "afterthought-board-v2",
  history = new History();
let board: Board,
  saveError = "";
try {
  const saved = localStorage.getItem(STORAGE);
  board = saved ? validateBoard(JSON.parse(saved)) : createBoard();
} catch {
  board = createBoard();
  saveError =
    "Saved board could not be read. It has not been overwritten; export this fresh board before replacing the old storage.";
}
$("app").innerHTML =
  `<header><a class="wordmark" href="./"><span class="mark">a.</span><span>AFTERTHOUGHT<small>MACHINE STORIES / A PLACE FOR WHAT’S NEXT</small></span></a><div class="header-right"><span id="save-status" role="status">SAVED ON THIS DEVICE</span><button id="setup" class="agent-pill"><i></i><span id="agent-status">HERMES / NOT CONNECTED</span><span>↗</span></button></div></header>
<main><section class="intro"><div><p class="eyebrow">A QUIET PLACE FOR LOUD IDEAS.</p><h1>Leave it here.<br><em>Come back to something.</em></h1></div><div class="intro-note">A thought. A sketch. A little homework.<br>Give it a pin. Give it some room.<span>YOUR NOTES STAY ON THIS DEVICE.</span></div></section>
<div class="workspace-top"><nav aria-label="Workspace mode"><button data-mode="board" aria-pressed="true">01 / Corkboard</button><button data-mode="diagram" aria-pressed="false">02 / Diagram</button><button data-mode="whiteboard" aria-pressed="false">03 / Whiteboard</button></nav><div class="history"><button id="undo" aria-label="Undo edit">↶</button><button id="redo" aria-label="Redo edit">↷</button><button id="export-board">↓ Board JSON</button><label class="file-label" for="import-board">↑ Bring a board</label><input id="import-board" class="sr-only" type="file" accept=".json,application/json"></div></div>
<section id="board-panel" class="workspace"><div class="surface-area"><div class="mode-toolbar"><label class="board-title-label" for="board-title">ON THE BOARD<input id="board-title" maxlength="120"></label><div><button id="new-note" class="primary">＋ A new thought</button><button id="board-png" class="quiet">↓ Snapshot</button></div></div><div id="cork-viewport" class="cork-viewport"><div id="cork" class="cork" aria-label="Corkboard with movable notes"><div class="board-tag">NO THOUGHT TOO SMALL.<span>KEEP THE UNFINISHED ONES, TOO.</span></div><div id="notes"></div></div></div><div class="surface-caption"><span>DRAG A NOTE BY ITS TOP EDGE. SCROLL TO FIND MORE ROOM.</span><span id="note-count"></span></div></div><aside id="note-inspector"><div class="inspector-id">THE NOTE IN FRONT OF YOU</div><div id="empty-selection"><h2>Pick a thought.<br><em>Stay a while.</em></h2><p>Select a note to write, choose a color, or give Hermes a task.</p><button id="empty-new" class="outline">＋ Make some room for an idea</button></div><div id="note-editor" hidden><label for="note-title">A little title</label><input id="note-title" maxlength="120"><label for="note-body">The brain dump</label><textarea id="note-body" maxlength="20000" rows="10" placeholder="It doesn’t have to be polished."></textarea><div id="note-colors" class="swatches" role="group" aria-label="Note color">${["butter", "rose", "sage", "blue"].map((c) => `<button data-color="${c}" class="swatch ${c}" aria-label="${c} note" aria-pressed="false"></button>`).join("")}</div><div id="task-state" role="status"></div><button id="read-reply" class="outline full" hidden>↗ Read Hermes’s reply</button><div class="agent-context"><label><input id="include-diagram" type="checkbox"> Include this board’s diagram</label><label><input id="include-ink" type="checkbox"> Include whiteboard stroke coordinates</label></div><button id="ask-agent" class="primary full">↗ Leave this with Hermes</button><button id="recover-agent" class="outline full" hidden>Recover this request</button><button id="check-agent" class="outline full" hidden>Check the run again</button><button id="stop-agent" class="outline full" hidden>Ask Hermes to stop</button><p class="privacy-note">Only the selected note and checked attachments are sent. Your Hermes provider and tools determine where that work runs.</p><button id="delete-note" class="text-button">Remove this note</button></div></aside></section>
<section id="diagram-panel" class="workspace" hidden><div class="surface-area"><div class="mode-toolbar"><div class="tool-group"><button id="add-block" class="primary">＋ Block</button><button id="connect-blocks" aria-pressed="false">↝ Connect</button><button id="architecture">Architecture starter</button><button id="storyboard">Storyboard starter</button></div><button id="diagram-svg" class="quiet">↓ SVG</button></div><div class="diagram-viewport"><svg id="diagram" xmlns="http://www.w3.org/2000/svg" aria-label="Architecture and storyboard diagram. Select blocks to edit, drag to move, or choose Connect then select two blocks." role="group"></svg></div><div class="surface-caption"><span id="diagram-help">A BLOCK FOR A RESPONSIBILITY. AN ARROW FOR A RELATIONSHIP.</span><span>1600 × 1100 / VECTOR</span></div></div><aside><div class="inspector-id">GIVE AN IDEA A SHAPE</div><h2>What connects<br><em>to what?</em></h2><p>Start with a few blocks. Drag them around. Connect two in order. Architecture, story beats, an idea before it has a name.</p><div id="diagram-editor" hidden><label for="block-label">Label</label><input id="block-label" maxlength="120"><div id="block-fields"><label for="block-detail">What happens here?</label><textarea id="block-detail" maxlength="2000" rows="4"></textarea><label for="block-shape">Shape</label><select id="block-shape"><option value="step">Process / step</option><option value="decision">Decision</option><option value="database">Database</option><option value="frame">Storyboard frame</option></select><div class="nudge" role="group" aria-label="Move selected block"><button data-nudge="-20,0" aria-label="Move block left">←</button><button data-nudge="0,-20" aria-label="Move block up">↑</button><button data-nudge="0,20" aria-label="Move block down">↓</button><button data-nudge="20,0" aria-label="Move block right">→</button></div></div><button id="delete-block" class="text-button">Remove selected item</button></div><p class="small">Diagram text and connections can accompany a note to Hermes. Whiteboard strokes are coordinates, not handwriting transcription.</p></aside></section>
<section id="whiteboard-panel" hidden><div class="ink-shell" id="ink-shell"><div class="mode-toolbar ink-toolbar"><div class="tool-group"><button id="pen" aria-pressed="true">✎ Pen</button><button id="eraser" aria-pressed="false">⌫ Eraser</button><label>Ink <input id="ink-color" type="color" value="#355447"></label><label>Weight <input id="ink-width" type="range" min="1" max="16" value="4"></label><label><input id="touch-draw" type="checkbox" checked> Draw with touch</label></div><div><button id="ink-png" class="quiet">↓ PNG</button><button id="focus-ink">Expand page</button><button id="clear-ink" class="quiet">Clear ink</button></div></div><div class="paper-wrap"><canvas id="ink" width="1100" height="1600" aria-label="Freehand whiteboard. Draw with mouse, touch, or a pressure-sensitive pen. Use the eraser or Undo to remove strokes." tabindex="0"></canvas></div><div class="surface-caption"><span>ROOM TO THINK WITH YOUR HANDS. PEN PRESSURE SUPPORTED.</span><span id="ink-count">0 STROKES</span></div></div></section>
<p id="status" class="status" role="status">No rush. Put something down.</p><section class="afterword"><p>For the idea that arrives<br>before the right words do.</p><span>The board is yours. Hermes is a guest.<br>It only gets to work when you ask.</span><span>LOCAL NOTES · ORIGINAL VECTOR DIAGRAMS<br>FREEHAND INK · REAL AGENT CONNECTION</span></section></main>
<dialog id="setup-dialog"><form method="dialog"><button class="dialog-close" aria-label="Close Hermes setup">×</button></form><p class="eyebrow">A SEAT AT THE BOARD</p><h2>Let Hermes<br><em>take a thought further.</em></h2><p>This board connects to <a href="https://hermes-agent.nousresearch.com/docs/user-guide/features/api-server" target="_blank" rel="noreferrer">Nous Research’s Hermes Agent</a>. The public demo is a local notebook; agent work requires your own installed gateway and configured model provider.</p><ol class="setup-steps"><li><b>Install and configure Hermes.</b><a href="https://hermes-agent.nousresearch.com/docs/getting-started/installation" target="_blank" rel="noreferrer">Open the official installation guide ↗</a><span>Then run <code>hermes setup</code> and choose a model provider. Its charges and tools are separate from this board.</span></li><li><b>Enable the gateway API.</b><span>In your Hermes configuration, set <code>API_SERVER_ENABLED=true</code> and a strong <code>API_SERVER_KEY</code>. Start <code>hermes gateway</code>.</span></li><li><b>Start this board locally.</b><span>Copy <code>.env.example</code> to <code>.env.local</code>, set <code>HERMES_API_KEY</code> to that same gateway key, then run:</span><pre>npm ci
npm run board</pre><span>Open <code>http://127.0.0.1:4198/</code>. The key stays in the local bridge, never in the browser or published build.</span></li></ol><button id="connect-agent" class="primary full">Check local Hermes connection</button><p id="connection-message" role="status"></p><p class="small">No agent is bundled or simulated. A stopped or incomplete run stays labeled as such. If Hermes requests approval or clarification, use its own interface; this board never auto-approves tools.</p></dialog>`;
let mode = "board",
  selected: string | null = null,
  diagramSelected: string | null = null,
  connectMode = false,
  connectFrom: string | null = null,
  inkTool = "pen",
  penActive = false,
  connected = false,
  token = "",
  pollBusy = false;
const cork = $("cork"),
  notes = $("notes"),
  svg = $<SVGSVGElement>("diagram"),
  ink = $<HTMLCanvasElement>("ink"),
  isLocal = ["127.0.0.1", "localhost"].includes(location.hostname);
const say = (s: string) => {
  $("status").textContent = s;
};
function persist() {
  board.updatedAt = now();
  try {
    const value = JSON.stringify(board);
    if (value.length > 3000000)
      throw Error(
        "Board storage limit reached. Export this board and start a smaller page.",
      );
    localStorage.setItem(STORAGE, value);
    $("save-status").textContent = "SAVED ON THIS DEVICE";
  } catch (e) {
    $("save-status").textContent = "NOT SAVED — EXPORT THIS BOARD";
    say((e as Error).message);
  }
}
function checkpoint() {
  history.push(board);
}
function selectedNote() {
  return board.notes.find((n) => n.id === selected);
}
const active = (n: Note) =>
  n.task &&
  !["completed", "incomplete", "failed", "cancelled", "interrupted"].includes(
    n.task.status,
  );
function taskLabel(n: Note) {
  const s = n.task?.status;
  return s === "completed"
    ? "REPLY READY"
    : s === "incomplete"
      ? "PARTIAL REPLY"
      : s === "submitting"
        ? "AWAITING RECEIPT"
        : (s?.replaceAll("_", " ").toUpperCase() ??
          (n.kind === "reply" ? "FROM HERMES" : "A THOUGHT, STILL YOURS"));
}
function renderNotes() {
  notes.replaceChildren(
    ...board.notes.map((n) => {
      const article = document.createElement("article");
      article.className = `pin-note ${n.color} ${n.kind === "reply" ? "agent-reply" : ""}`;
      article.dataset.note = n.id;
      article.style.left = n.x + "px";
      article.style.top = n.y + "px";
      article.style.setProperty("--turn", n.rotation + "deg");
      article.setAttribute("aria-label", n.title);
      article.dataset.selected = String(n.id === selected);
      const grip = document.createElement("button");
      grip.className = "note-grip";
      grip.setAttribute("aria-label", `Move ${n.title}`);
      grip.innerHTML =
        '<span class="pin"></span><span class="grip-dots">⠿</span>';
      const read = document.createElement("button");
      read.className = "note-read";
      read.setAttribute("aria-pressed", String(n.id === selected));
      const meta = document.createElement("span");
      meta.className = "note-meta";
      meta.textContent = taskLabel(n);
      const title = document.createElement("h3");
      title.textContent = n.title;
      const body = document.createElement("p");
      body.textContent = n.body;
      const foot = document.createElement("span");
      foot.className = "note-foot";
      foot.textContent =
        n.kind === "reply" ? "READ THE REPLY ↗" : "OPEN THIS THOUGHT ↗";
      read.append(meta, title, body, foot);
      read.onclick = () => selectNote(n.id);
      article.append(grip, read);
      return article;
    }),
  );
  $("note-count").textContent =
    `${board.notes.filter((n) => n.kind === "note").length} THOUGHTS / ${board.notes.filter((n) => n.kind === "reply").length} REPLIES`;
}
function selectNote(id: string | null) {
  selected = id;
  renderNotes();
  editor();
}
function editor() {
  const n = selectedNote();
  $("empty-selection").hidden = !!n;
  $("note-editor").hidden = !n;
  if (!n) return;
  $<HTMLInputElement>("note-title").value = n.title;
  $<HTMLTextAreaElement>("note-body").value = n.body;
  $<HTMLTextAreaElement>("note-body").readOnly = n.kind === "reply";
  $<HTMLInputElement>("note-title").readOnly = n.kind === "reply";
  document
    .querySelectorAll<HTMLElement>("[data-color]")
    .forEach((e) =>
      e.setAttribute("aria-pressed", String(e.dataset.color === n.color)),
    );
  $("note-colors").hidden = n.kind === "reply";
  $("read-reply").hidden = !board.notes.some(
    (p) => p.sourceId === n.id && p.kind === "reply",
  );
  $("ask-agent").hidden = n.kind === "reply";
  $<HTMLButtonElement>("ask-agent").disabled = !!active(n);
  $("recover-agent").hidden = !(
    n.task?.status === "submitting" ||
    (n.task?.status === "unknown" && !n.task?.runId)
  );
  $("check-agent").hidden = !n.task?.runId;
  $("stop-agent").hidden =
    !n.task?.runId || !active(n) || n.task.status === "unknown";
  $("task-state").textContent = n.task
    ? `${taskLabel(n)}${n.task.error ? " · " + n.task.error : ""}`
    : n.kind === "reply"
      ? "A response received from your Hermes run."
      : "A note stays private until you send it.";
  document.querySelector<HTMLElement>(".agent-context")!.hidden =
    n.kind === "reply";
}
function renderAll() {
  renderNotes();
  editor();
  diagramEditor();
  drawInk(ink, board.strokes);
  $("ink-count").textContent = board.strokes.length + " STROKES";
  pointCount = board.strokes.reduce((n, s) => n + s.points.length, 0);
  $<HTMLInputElement>("board-title").value = board.title;
}
function addNote() {
  if (board.notes.length >= 80) {
    say("This board is full. Export it or remove a note.");
    return;
  }
  checkpoint();
  const viewport = $("cork-viewport");
  const spot = notePosition(board.notes);
  const n = newNote("An unfinished thought", "", "butter", spot.x, spot.y);
  viewport.scrollTo({
    left: Math.max(0, n.x - 40),
    top: Math.max(0, n.y - 80),
  });
  board.notes.push(n);
  selected = n.id;
  persist();
  renderAll();
  $<HTMLTextAreaElement>("note-body").focus();
  say("A little room for something new.");
}
$("new-note").onclick = addNote;
$("empty-new").onclick = addNote;
for (const id of ["note-title", "note-body", "board-title"]) {
  $(id).onfocus = () => checkpoint();
  $(id).oninput = () => {
    if (id === "board-title") board.title = $<HTMLInputElement>(id).value;
    else {
      const n = selectedNote();
      if (!n || n.kind === "reply") return;
      if (id === "note-title") n.title = $<HTMLInputElement>(id).value;
      else n.body = $<HTMLTextAreaElement>(id).value;
      renderNotes();
    }
    persist();
  };
}
document.querySelectorAll<HTMLButtonElement>("[data-color]").forEach(
  (e) =>
    (e.onclick = () => {
      const n = selectedNote();
      if (!n || n.kind === "reply") return;
      checkpoint();
      n.color = e.dataset.color as Note["color"];
      persist();
      renderNotes();
      editor();
    }),
);
$("delete-note").onclick = () => {
  const n = selectedNote();
  if (!n) return;
  if (active(n)) {
    say(
      "This note has an unfinished agent run. Stop or resolve it before removing the note.",
    );
    return;
  }
  checkpoint();
  board.notes = board.notes.filter((p) => p.id !== n.id);
  selected = null;
  persist();
  renderAll();
  say("Note removed. Undo brings it back.");
};
$("read-reply").onclick = () => {
  const n = selectedNote(),
    reply = [...board.notes]
      .reverse()
      .find((p) => p.sourceId === n?.id && p.kind === "reply");
  if (reply) {
    selectNote(reply.id);
    $("cork-viewport").scrollTo({
      left: Math.max(0, reply.x - 40),
      top: Math.max(0, reply.y - 80),
    });
  }
};
let noteDrag: {
  id: string;
  x: number;
  y: number;
  left: number;
  top: number;
} | null = null;
notes.onpointerdown = (e) => {
  const grip = (e.target as HTMLElement).closest(".note-grip");
  if (!grip) return;
  const el = grip.closest<HTMLElement>("[data-note]")!,
    n = board.notes.find((n) => n.id === el.dataset.note)!;
  checkpoint();
  noteDrag = { id: n.id, x: e.clientX, y: e.clientY, left: n.x, top: n.y };
  notes.setPointerCapture(e.pointerId);
  e.preventDefault();
};
notes.onpointermove = (e) => {
  if (!noteDrag) return;
  const n = board.notes.find((n) => n.id === noteDrag!.id)!;
  n.x = Math.max(0, Math.min(2110, noteDrag.left + e.clientX - noteDrag.x));
  n.y = Math.max(0, Math.min(1320, noteDrag.top + e.clientY - noteDrag.y));
  const el = notes.querySelector<HTMLElement>(
    `[data-note="${CSS.escape(n.id)}"]`,
  )!;
  el.style.left = n.x + "px";
  el.style.top = n.y + "px";
};
notes.onpointerup = () => {
  if (noteDrag) {
    selected = noteDrag.id;
    noteDrag = null;
    persist();
    renderNotes();
    editor();
  }
};
notes.onpointercancel = () => {
  noteDrag = null;
  persist();
};
notes.onkeydown = (e) => {
  if (
    !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key) ||
    !(e.target as Element).closest(".note-grip")
  )
    return;
  const el = (e.target as Element).closest<HTMLElement>("[data-note]"),
    n = board.notes.find((n) => n.id === el?.dataset.note);
  if (!n) return;
  e.preventDefault();
  checkpoint();
  n.x = Math.max(
    0,
    Math.min(
      2110,
      n.x + (e.key === "ArrowLeft" ? -20 : e.key === "ArrowRight" ? 20 : 0),
    ),
  );
  n.y = Math.max(
    0,
    Math.min(
      1320,
      n.y + (e.key === "ArrowUp" ? -20 : e.key === "ArrowDown" ? 20 : 0),
    ),
  );
  persist();
  renderNotes();
  notes
    .querySelector<HTMLButtonElement>(
      `[data-note="${CSS.escape(n.id)}"] .note-grip`,
    )
    ?.focus();
};
document.querySelectorAll<HTMLButtonElement>("[data-mode]").forEach(
  (button) =>
    (button.onclick = () => {
      mode = button.dataset.mode!;
      for (const m of ["board", "diagram", "whiteboard"])
        $(m + "-panel").hidden = m !== mode;
      document
        .querySelectorAll("[data-mode]")
        .forEach((e) =>
          e.setAttribute(
            "aria-pressed",
            String((e as HTMLElement).dataset.mode === mode),
          ),
        );
      say(
        mode === "board"
          ? "No rush. Put something down."
          : mode === "diagram"
            ? "A little structure for a sprawling thought."
            : "Draw with a pen, finger, or mouse. The ink stays here.",
      );
      if (mode === "whiteboard") drawInk(ink, board.strokes);
    }),
);
function keepRuns(previous: Board) {
  for (const n of board.notes) {
    if (n.task || n.kind === "reply") {
      const old = previous.notes.find((p) => p.id === n.id);
      if (old && n.task) old.task = structuredClone(n.task);
      else if ((!old && active(n)) || (!old && n.kind === "reply"))
        previous.notes.push(structuredClone(n));
    }
  }
  return previous;
}
$("undo").onclick = () => {
  const previous = history.undo(board);
  if (previous) {
    board = keepRuns(previous);
    persist();
    renderAll();
    say("One thought back. Agent requests are not re-executed or forgotten.");
  }
};
$("redo").onclick = () => {
  const next = history.redo(board);
  if (next) {
    board = keepRuns(next);
    persist();
    renderAll();
    say("One thought forward.");
  }
};
$("export-board").onclick = () => saveJSON(board, "afterthought-board.json");
$<HTMLInputElement>("import-board").onchange = async () => {
  try {
    const f = $<HTMLInputElement>("import-board").files?.[0];
    if (!f) return;
    if (f.size > 3000000) throw Error("Board file exceeds 3 MB.");
    const next = validateBoard(JSON.parse(await f.text()));
    if (board.notes.some(active))
      throw Error(
        "Resolve or stop your active agent runs before replacing this board.",
      );
    checkpoint();
    board = next;
    selected = null;
    diagramSelected = null;
    persist();
    renderAll();
    say("Board brought back. Importing never sends a new agent request.");
  } catch (e) {
    say((e as Error).message);
  } finally {
    $<HTMLInputElement>("import-board").value = "";
  }
};
function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
$("board-png").onclick = () =>
  boardImage(board).toBlob((blob) => {
    if (blob) download(blob, "afterthought-corkboard.png");
  });
// Diagram editor: native SVG geometry, explicit connectors, accessible form edits.
function diagramEditor() {
  const n = board.diagram.nodes.find((n) => n.id === diagramSelected),
    edge = board.diagram.edges.find((e) => e.id === diagramSelected);
  $("diagram-editor").hidden = !n && !edge;
  $("block-fields").hidden = !n;
  if (n) {
    $<HTMLInputElement>("block-label").value = n.label;
    $<HTMLTextAreaElement>("block-detail").value = n.detail;
    $<HTMLSelectElement>("block-shape").value = n.shape;
  } else if (edge) $<HTMLInputElement>("block-label").value = edge.label;
  renderDiagram(svg, board, diagramSelected, connectFrom);
}
$("add-block").onclick = () => {
  if (board.diagram.nodes.length >= 50) {
    say("This diagram has reached 50 blocks.");
    return;
  }
  checkpoint();
  const n: DiagramNode = {
    id: uid(),
    label: "A new possibility",
    detail: "",
    shape: "step",
    x: 100 + (board.diagram.nodes.length % 4) * 280,
    y: 110 + ((Math.floor(board.diagram.nodes.length / 4) * 160) % 900),
  };
  board.diagram.nodes.push(n);
  diagramSelected = n.id;
  persist();
  diagramEditor();
};
for (const kind of ["architecture", "storyboard"] as const)
  $(kind).onclick = () => {
    if (board.diagram.nodes.length) {
      say(
        "Starter layouts are for an empty diagram. Remove the existing blocks or undo to return to an empty page.",
      );
      return;
    }
    checkpoint();
    board.diagram = diagramTemplate(kind);
    diagramSelected = board.diagram.nodes[0]!.id;
    persist();
    diagramEditor();
  };
$("connect-blocks").onclick = () => {
  connectMode = !connectMode;
  connectFrom = null;
  $("connect-blocks").setAttribute("aria-pressed", String(connectMode));
  $("diagram-help").textContent = connectMode
    ? "CHOOSE A SOURCE BLOCK, THEN A DESTINATION."
    : "A BLOCK FOR A RESPONSIBILITY. AN ARROW FOR A RELATIONSHIP.";
  diagramEditor();
};
function selectDiagram(id: string, isNode: boolean) {
  if (connectMode && isNode) {
    if (!connectFrom) {
      connectFrom = id;
      $("diagram-help").textContent = "NOW CHOOSE THE DESTINATION BLOCK.";
    } else if (connectFrom !== id) {
      if (board.diagram.edges.length >= 100) {
        say("This diagram has reached 100 links.");
        return;
      }
      if (
        !board.diagram.edges.some((e) => e.from === connectFrom && e.to === id)
      ) {
        checkpoint();
        board.diagram.edges.push({
          id: uid(),
          from: connectFrom,
          to: id,
          label: "",
        });
        persist();
      }
      connectFrom = null;
      $("diagram-help").textContent =
        "CONNECTED. CHOOSE ANOTHER SOURCE, OR TURN CONNECT OFF.";
    }
  }
  diagramSelected = id;
  diagramEditor();
}
let diagramDrag: {
  id: string;
  x: number;
  y: number;
  left: number;
  top: number;
} | null = null;
svg.onpointerdown = (e) => {
  const node = (e.target as Element).closest<SVGGElement>("[data-node]"),
    edge = (e.target as Element).closest<SVGGElement>("[data-edge]");
  if (edge) {
    selectDiagram(edge.dataset.edge!, false);
    return;
  }
  if (!node) return;
  const id = node.dataset.node!,
    n = board.diagram.nodes.find((n) => n.id === id)!;
  if (connectMode) {
    selectDiagram(id, true);
    return;
  }
  checkpoint();
  const r = svg.getBoundingClientRect();
  diagramDrag = {
    id,
    x: (e.clientX * 1600) / r.width,
    y: (e.clientY * 1100) / r.height,
    left: n.x,
    top: n.y,
  };
  svg.setPointerCapture(e.pointerId);
  selectDiagram(id, true);
  e.preventDefault();
};
svg.onpointermove = (e) => {
  if (!diagramDrag) return;
  const r = svg.getBoundingClientRect(),
    n = board.diagram.nodes.find((n) => n.id === diagramDrag!.id)!;
  n.x = Math.max(
    0,
    Math.min(
      1380,
      diagramDrag.left + (e.clientX * 1600) / r.width - diagramDrag.x,
    ),
  );
  n.y = Math.max(
    0,
    Math.min(
      970,
      diagramDrag.top + (e.clientY * 1100) / r.height - diagramDrag.y,
    ),
  );
  renderDiagram(svg, board, diagramSelected, connectFrom);
};
svg.onpointerup = () => {
  if (diagramDrag) {
    diagramDrag = null;
    persist();
  }
};
svg.onpointercancel = () => {
  diagramDrag = null;
  persist();
};
svg.onkeydown = (e) => {
  const el = (e.target as Element).closest<SVGElement>(
    "[data-node],[data-edge]",
  );
  if (!el) return;
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    selectDiagram(el.dataset.node ?? el.dataset.edge!, !!el.dataset.node);
  }
};
for (const id of ["block-label", "block-detail", "block-shape"]) {
  $(id).onfocus = () => checkpoint();
  $(id).oninput = () => {
    const n = board.diagram.nodes.find((n) => n.id === diagramSelected),
      edge = board.diagram.edges.find((e) => e.id === diagramSelected);
    if (n) {
      n.label = $<HTMLInputElement>("block-label").value;
      n.detail = $<HTMLTextAreaElement>("block-detail").value;
      n.shape = $<HTMLSelectElement>("block-shape")
        .value as DiagramNode["shape"];
    } else if (edge)
      edge.label = $<HTMLInputElement>("block-label").value.slice(0, 100);
    persist();
    renderDiagram(svg, board, diagramSelected, connectFrom);
  };
}
document.querySelectorAll<HTMLButtonElement>("[data-nudge]").forEach(
  (b) =>
    (b.onclick = () => {
      const n = board.diagram.nodes.find((n) => n.id === diagramSelected);
      if (!n) return;
      checkpoint();
      const [dx, dy] = b.dataset.nudge!.split(",").map(Number);
      n.x = Math.max(0, Math.min(1380, n.x + dx!));
      n.y = Math.max(0, Math.min(970, n.y + dy!));
      persist();
      diagramEditor();
    }),
);
$("delete-block").onclick = () => {
  if (!diagramSelected) return;
  checkpoint();
  board.diagram.nodes = board.diagram.nodes.filter(
    (n) => n.id !== diagramSelected,
  );
  board.diagram.edges = board.diagram.edges.filter(
    (e) =>
      e.id !== diagramSelected &&
      e.from !== diagramSelected &&
      e.to !== diagramSelected,
  );
  diagramSelected = null;
  persist();
  diagramEditor();
};
$("diagram-svg").onclick = () => {
  const copy = svg.cloneNode(true) as SVGSVGElement;
  copy.setAttribute("width", "1600");
  copy.setAttribute("height", "1100");
  download(
    new Blob([new XMLSerializer().serializeToString(copy)], {
      type: "image/svg+xml",
    }),
    "afterthought-diagram.svg",
  );
};
// Freehand ink uses pressure and coalesced pointer samples; browser touch gestures are disabled only on paper.
let inkPointer: number | null = null,
  stroke: Stroke | null = null,
  erasing = false,
  pointCount = board.strokes.reduce((n, s) => n + s.points.length, 0);
const inkPoint = (e: PointerEvent) => {
  const r = ink.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(INK_W, ((e.clientX - r.left) / r.width) * INK_W)),
    y: Math.max(0, Math.min(INK_H, ((e.clientY - r.top) / r.height) * INK_H)),
    p: e.pressure > 0 ? Math.min(1, e.pressure) : 0.5,
  };
};
ink.onpointerdown = (e) => {
  if (inkPointer !== null) return;
  if (
    e.pointerType === "touch" &&
    (!$<HTMLInputElement>("touch-draw").checked || penActive)
  )
    return;
  if (e.pointerType === "pen") penActive = true;
  if (board.strokes.length >= 500 || pointCount >= 100000) {
    say("This page is full. Export it before starting another.");
    return;
  }
  checkpoint();
  inkPointer = e.pointerId;
  try {
    ink.setPointerCapture(e.pointerId);
  } catch {
    /* A detached or synthetic pointer can have no capture target. */
  }
  e.preventDefault();
  const p = inkPoint(e);
  if (inkTool === "eraser") {
    erasing = true;
    board.strokes = board.strokes.filter((s) => !hitsStroke(s, p.x, p.y));
    drawInk(ink, board.strokes);
  } else {
    stroke = {
      id: uid(),
      color: $<HTMLInputElement>("ink-color").value,
      width: Number($<HTMLInputElement>("ink-width").value),
      points: [p],
    };
    board.strokes.push(stroke);
    drawInk(ink, board.strokes);
  }
};
ink.onpointermove = (e) => {
  if ((!stroke && !erasing) || e.pointerId !== inkPointer) return;
  const before = stroke?.points.length ?? 0;
  e.preventDefault();
  const events = e.getCoalescedEvents?.() ?? [e];
  if (erasing) {
    const p = inkPoint(e);
    board.strokes = board.strokes.filter((s) => !hitsStroke(s, p.x, p.y));
  } else if (stroke) {
    for (const sample of events.length ? events : [e]) {
      if (stroke.points.length >= 5000 || pointCount >= 100000) break;
      stroke.points.push(inkPoint(sample));
      pointCount++;
    }
  }
  if (erasing) drawInk(ink, board.strokes);
  else if (stroke) drawStroke(ink, stroke, before);
};
function finishInk() {
  if (stroke || erasing) {
    stroke = null;
    erasing = false;
    pointCount = board.strokes.reduce((n, s) => n + s.points.length, 0);
    persist();
    $("ink-count").textContent = board.strokes.length + " STROKES";
  }
  penActive = false;
  inkPointer = null;
}
ink.onpointerup = (e) => {
  if (e.pointerId === inkPointer) finishInk();
};
ink.onpointercancel = (e) => {
  if (e.pointerId === inkPointer) finishInk();
};
window.addEventListener("blur", finishInk);
for (const tool of ["pen", "eraser"])
  $(tool).onclick = () => {
    inkTool = tool;
    for (const t of ["pen", "eraser"])
      $(t).setAttribute("aria-pressed", String(t === tool));
  };
$("clear-ink").onclick = () => {
  if (!board.strokes.length) return;
  checkpoint();
  board.strokes = [];
  pointCount = 0;
  persist();
  drawInk(ink, board.strokes);
  $("ink-count").textContent = "0 STROKES";
  say("A fresh sheet. Undo can bring the ink back.");
};
$("ink-png").onclick = () =>
  ink.toBlob((b) => {
    if (b) download(b, "afterthought-whiteboard.png");
  });
$("focus-ink").onclick = () => {
  const expanded = $("ink-shell").classList.toggle("expanded");
  $("focus-ink").textContent = expanded ? "Back to the board" : "Expand page";
};
// Hermes gateway: server-side credential, durable run IDs, explicit submission, no simulated replies.
$("setup").onclick = () => $<HTMLDialogElement>("setup-dialog").showModal();
async function request(path: string, method = "GET", data?: unknown) {
  const r = await fetch(import.meta.env.BASE_URL + "agent" + path, {
    method,
    headers: { "Content-Type": "application/json", "X-Board-Token": token },
    body: data ? JSON.stringify(data) : undefined,
  });
  let value;
  try {
    value = await r.json();
  } catch {
    throw Error(
      "The local board bridge is not running. Use npm run board and the local URL.",
    );
  }
  if (!r.ok) throw Error(value.error ?? `Bridge returned ${r.status}`);
  return value;
}
async function connect() {
  if (!isLocal) {
    $("connection-message").textContent =
      "You’re viewing the public notebook. Start this repository locally with npm run board to connect your Hermes gateway.";
    return;
  }
  try {
    const r = await request("/health");
    token = r.token ?? "";
    connected = r.connected === true;
    $("connection-message").textContent = r.message;
    $("agent-status").textContent = connected
      ? "HERMES / CONNECTED"
      : "HERMES / NOT CONNECTED";
    $("setup").classList.toggle("connected", connected);
    if (connected) {
      sessionStorage.setItem("afterthought-connect", "yes");
      void pollRuns();
    }
  } catch (e) {
    connected = false;
    $("connection-message").textContent = (e as Error).message;
    $("agent-status").textContent = "HERMES / NOT CONNECTED";
  }
}
$("connect-agent").onclick = () => void connect();
async function submit(n: Note, recover = false) {
  if (!connected) {
    $<HTMLDialogElement>("setup-dialog").showModal();
    say("Connect a real Hermes gateway before sending this note.");
    return;
  }
  try {
    if (!recover) {
      if (!n.body.trim() && !n.title.trim())
        throw Error("Write a thought before sending it.");
      const input = taskInput(
        n,
        board,
        $<HTMLInputElement>("include-diagram").checked,
        $<HTMLInputElement>("include-ink").checked,
      );
      if (input.length > 100000)
        throw Error(
          "The selected context is too large. Omit the whiteboard strokes or shorten the note.",
        );
      n.task = {
        key: uid(),
        input,
        status: "submitting",
        createdAt: now(),
        updatedAt: now(),
      };
      persist();
      renderNotes();
      editor();
    }
    if (!n.task) return;
    const r = await request("/runs", "POST", {
      key: n.task.key,
      input: n.task.input,
    });
    if (
      typeof r.run_id !== "string" ||
      !/^[a-zA-Z0-9_-]{1,150}$/.test(r.run_id)
    )
      throw Error(
        "Hermes did not return a valid run receipt. Recover with the same request key.",
      );
    n.task.runId = r.run_id;
    n.task.status = "queued";
    n.task.error = undefined;
    n.task.updatedAt = now();
    persist();
    renderNotes();
    editor();
    say(
      "Hermes has the note. Its response will be pinned here when the run finishes.",
    );
    void pollRuns();
  } catch (e) {
    if (n.task) {
      n.task.error = (e as Error).message;
      n.task.status = "unknown";
      persist();
      renderNotes();
      editor();
    }
    say((e as Error).message);
  }
}
$("ask-agent").onclick = () => {
  const n = selectedNote();
  if (n) void submit(n);
};
$("recover-agent").onclick = () => {
  const n = selectedNote();
  if (n) void submit(n, true);
};
async function check(n: Note) {
  if (!n.task?.runId || !connected) return;
  try {
    const r = await request("/runs/" + n.task.runId);
    applyRun(board, n, r);
    persist();
    renderNotes();
    if (n.id === selected) editor();
    if (n.task.status === "completed")
      say(
        "A reply is on the board. Read it, keep it, or start another thought.",
      );
  } catch (e) {
    if (n.task) n.task.error = (e as Error).message;
    persist();
    if (n.id === selected) editor();
  }
}
async function pollRuns() {
  if (pollBusy || !connected) return;
  pollBusy = true;
  try {
    for (const n of board.notes.filter((n) => n.task?.runId && active(n)))
      await check(n);
  } finally {
    pollBusy = false;
  }
}
$("check-agent").onclick = () => {
  const n = selectedNote();
  if (n) void check(n);
};
$("stop-agent").onclick = async () => {
  const n = selectedNote();
  if (!n?.task?.runId) return;
  try {
    await request("/runs/" + n.task.runId + "/stop", "POST", {});
    n.task.status = "stopping";
    persist();
    editor();
    renderNotes();
    say(
      "Stop requested. The run stays active until Hermes confirms it has stopped.",
    );
  } catch (e) {
    say((e as Error).message);
  }
};
setInterval(() => {
  if (!document.hidden) void pollRuns();
}, 2500);
document.addEventListener("keydown", (e) => {
  if ((e.target as HTMLElement).matches("input,textarea,select")) return;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
    e.preventDefault();
    $(e.shiftKey ? "redo" : "undo").click();
  }
});
renderAll();
if (saveError) {
  say(saveError);
  $("save-status").textContent = "RECOVERY NEEDED — EXPORT BEFORE EDITING";
} else persist();
if (isLocal && sessionStorage.getItem("afterthought-connect") === "yes")
  void connect();
(window as any).afterthought = {
  get board() {
    return board;
  },
  get connected() {
    return connected;
  },
  select: selectNote,
  save: persist,
  applyRun: (id: string, r: unknown) => {
    const n = board.notes.find((n) => n.id === id);
    if (n) {
      applyRun(board, n, r);
      persist();
      renderAll();
    }
  },
};
