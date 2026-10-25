export type Color = "butter" | "rose" | "sage" | "blue" | "paper";
export type TaskStatus =
  | "submitting"
  | "queued"
  | "running"
  | "waiting_for_approval"
  | "waiting_for_input"
  | "stopping"
  | "unknown"
  | "completed"
  | "incomplete"
  | "failed"
  | "cancelled"
  | "interrupted";
export interface AgentTask {
  key: string;
  input: string;
  runId?: string;
  status: TaskStatus;
  error?: string;
  createdAt: string;
  updatedAt: string;
}
export interface Note {
  id: string;
  title: string;
  body: string;
  color: Color;
  x: number;
  y: number;
  rotation: number;
  kind: "note" | "reply";
  sourceId?: string;
  runId?: string;
  task?: AgentTask;
  createdAt: string;
}
export interface DiagramNode {
  id: string;
  label: string;
  detail: string;
  shape: "step" | "decision" | "database" | "frame";
  x: number;
  y: number;
}
export interface DiagramEdge {
  id: string;
  from: string;
  to: string;
  label: string;
}
export interface Stroke {
  id: string;
  color: string;
  width: number;
  points: { x: number; y: number; p: number }[];
}
export interface Board {
  version: 2;
  id: string;
  title: string;
  notes: Note[];
  diagram: { nodes: DiagramNode[]; edges: DiagramEdge[] };
  strokes: Stroke[];
  updatedAt: string;
}
export const uid = () => crypto.randomUUID();
export const now = () => new Date().toISOString();
export function newNote(
  title = "An unfinished thought",
  body = "",
  color: Color = "butter",
  x = 90,
  y = 90,
): Note {
  return {
    id: uid(),
    title,
    body,
    color,
    x,
    y,
    rotation: (Math.random() - 0.5) * 3,
    kind: "note",
    createdAt: now(),
  };
}
export function notePosition(notes: Note[]) {
  for (let row = 0; row < 4; row++)
    for (let col = 0; col < 7; col++) {
      const x = 90 + col * 320,
        y = 90 + row * 380;
      if (
        !notes.some((n) => Math.abs(n.x - x) < 295 && Math.abs(n.y - y) < 350)
      )
        return { x, y };
    }
  return { x: 90, y: 90 };
}
export function createBoard(): Board {
  return {
    version: 2,
    id: uid(),
    title: "Things worth coming back to",
    notes: [
      newNote(
        "This is a place to think out loud.",
        "Starter note\n\nLeave an idea, a question, or the thing you keep putting off. Move it around. Let it stay unfinished.",
        "butter",
        90,
        105,
      ),
      newNote(
        "Give Hermes a little homework.",
        "Starter note\n\nSelect a note and choose Ask Hermes. A configured agent can work on it and pin a response back here. Nothing runs just because you wrote a note.",
        "sage",
        430,
        185,
      ),
      newNote(
        "Some ideas need more room.",
        "Starter note\n\nSwitch to Diagram for architecture or story beats. Switch to Whiteboard to draw with a finger, mouse, or pen.",
        "rose",
        770,
        90,
      ),
    ],
    diagram: { nodes: [], edges: [] },
    strokes: [],
    updatedAt: now(),
  };
}
const finite = (n: unknown, min: number, max: number) =>
  typeof n === "number" && Number.isFinite(n) && n >= min && n <= max;
const str = (s: unknown, max: number) =>
  typeof s === "string" && s.length <= max;
const statuses: TaskStatus[] = [
  "submitting",
  "queued",
  "running",
  "waiting_for_approval",
  "waiting_for_input",
  "stopping",
  "unknown",
  "completed",
  "incomplete",
  "failed",
  "cancelled",
  "interrupted",
];
export function validateBoard(value: unknown): Board {
  const b = value as Board;
  if (
    !b ||
    b.version !== 2 ||
    !str(b.id, 100) ||
    !str(b.title, 120) ||
    !str(b.updatedAt, 80) ||
    !Array.isArray(b.notes) ||
    b.notes.length > 80 ||
    !b.diagram ||
    !Array.isArray(b.diagram.nodes) ||
    !Array.isArray(b.diagram.edges) ||
    b.diagram.nodes.length > 50 ||
    b.diagram.edges.length > 100 ||
    !Array.isArray(b.strokes) ||
    b.strokes.length > 500
  )
    throw Error(
      "Use an Afterthought version 2 board (80 notes, 50 diagram blocks, 100 links, 500 strokes max).",
    );
  const ids = new Set<string>();
  for (const n of b.notes) {
    if (
      !n ||
      !str(n.id, 100) ||
      ids.has(n.id) ||
      !str(n.title, 120) ||
      !str(n.body, 20000) ||
      !["butter", "rose", "sage", "blue", "paper"].includes(n.color) ||
      !finite(n.x, 0, 2110) ||
      !finite(n.y, 0, 1320) ||
      !finite(n.rotation, -5, 5) ||
      !["note", "reply"].includes(n.kind) ||
      !str(n.createdAt, 80)
    )
      throw Error("Invalid note");
    ids.add(n.id);
    if (
      n.task &&
      (!str(n.task.key, 100) ||
        !str(n.task.input, 100000) ||
        !statuses.includes(n.task.status) ||
        (n.task.runId !== undefined && !str(n.task.runId, 150)) ||
        !str(n.task.createdAt, 80) ||
        !str(n.task.updatedAt, 80))
    )
      throw Error("Invalid agent task");
  }
  const nodeIds = new Set<string>();
  for (const n of b.diagram.nodes) {
    if (
      !n ||
      !str(n.id, 100) ||
      nodeIds.has(n.id) ||
      !str(n.label, 120) ||
      !str(n.detail, 2000) ||
      !["step", "decision", "database", "frame"].includes(n.shape) ||
      !finite(n.x, 0, 1400) ||
      !finite(n.y, 0, 1000)
    )
      throw Error("Invalid diagram block");
    nodeIds.add(n.id);
  }
  const edgeIds = new Set<string>();
  for (const e of b.diagram.edges) {
    if (
      !e ||
      !str(e.id, 100) ||
      edgeIds.has(e.id) ||
      !nodeIds.has(e.from) ||
      !nodeIds.has(e.to) ||
      e.from === e.to ||
      !str(e.label, 100)
    )
      throw Error("Invalid diagram link");
    edgeIds.add(e.id);
  }
  let points = 0;
  for (const s of b.strokes) {
    if (
      !s ||
      !str(s.id, 100) ||
      !/^#[0-9a-f]{6}$/i.test(s.color) ||
      !finite(s.width, 0.5, 30) ||
      !Array.isArray(s.points) ||
      s.points.length < 1 ||
      s.points.length > 5000 ||
      s.points.some(
        (p) =>
          !p ||
          !finite(p.x, 0, 1100) ||
          !finite(p.y, 0, 1600) ||
          !finite(p.p, 0, 1),
      )
    )
      throw Error("Invalid drawing stroke");
    points += s.points.length;
  }
  if (points > 100000)
    throw Error(
      "This board exceeds 100,000 ink points. Export before making a fresh page.",
    );
  return structuredClone(b);
}
export class History {
  private undoStack: Board[] = [];
  private redoStack: Board[] = [];
  push(b: Board) {
    this.undoStack.push(structuredClone(b));
    if (this.undoStack.length > 20) this.undoStack.shift();
    this.redoStack = [];
  }
  undo(b: Board) {
    const previous = this.undoStack.pop();
    if (!previous) return null;
    this.redoStack.push(structuredClone(b));
    return previous;
  }
  redo(b: Board) {
    const next = this.redoStack.pop();
    if (!next) return null;
    this.undoStack.push(structuredClone(b));
    return next;
  }
  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
}
export function diagramContext(b: Board) {
  return (
    b.diagram.nodes
      .map((n) => `${n.id}: ${n.label}${n.detail ? " — " + n.detail : ""}`)
      .join("\n") +
    "\nLinks:\n" +
    b.diagram.edges
      .map((e) => `${e.from} -> ${e.to}${e.label ? " (" + e.label + ")" : ""}`)
      .join("\n")
  );
}
export function taskInput(
  note: Note,
  b: Board,
  includeDiagram: boolean,
  includeInk: boolean,
) {
  return `A note left on a personal corkboard. Respond to the request, clearly separating work completed from suggestions and blockers. Do not say a task is done unless it is actually complete.\n\nTitle: ${note.title}\n\n${note.body}${includeDiagram ? "\n\nAttached diagram (block IDs and links):\n" + diagramContext(b) : ""}${includeInk ? "\n\nWhiteboard ink data (canvas 1100×1600; coordinates are not OCR):\n" + JSON.stringify(b.strokes) : ""}`;
}
export function applyRun(b: Board, source: Note, data: unknown) {
  const r = data as Record<string, unknown>;
  if (!r || typeof r.status !== "string")
    throw Error("Hermes returned an invalid run status.");
  const status = r.status === "started" ? "queued" : r.status;
  let actual: TaskStatus = statuses.includes(status as TaskStatus)
    ? (status as TaskStatus)
    : "unknown";
  if (
    r.finish_reason === "length" ||
    r.error_code === "iteration_budget_exhausted"
  )
    actual = "incomplete";
  if (!source.task) throw Error("Missing task");
  if (
    actual === "completed" &&
    (typeof r.output !== "string" || !r.output.trim())
  ) {
    source.task.status = "unknown";
    source.task.error =
      "Hermes reported completion without final text. Check the run in Hermes.";
    return "unknown";
  }
  source.task.status = actual;
  source.task.updatedAt = now();
  if (r.error)
    source.task.error = (
      typeof r.error === "string" ? r.error : JSON.stringify(r.error)
    ).slice(0, 1500);
  if (
    (actual === "completed" || actual === "incomplete") &&
    typeof r.output === "string" &&
    r.output.trim()
  ) {
    const runId = source.task.runId ?? source.task.key;
    if (!b.notes.some((n) => n.runId === runId && n.kind === "reply")) {
      if (b.notes.length >= 80) {
        source.task.status = "unknown";
        throw Error(
          "The board is full. Export or remove a note, then check the run again.",
        );
      }
      const spot = notePosition(b.notes);
      const reply = newNote(
        `${actual === "incomplete" ? "Hermes · partial" : "Hermes"} / ${source.title}`.slice(
          0,
          120,
        ),
        r.output.length > 20000
          ? r.output.slice(0, 19850) +
              "\n\n[This board truncates long replies. Read the complete run in Hermes.]"
          : r.output,
        "paper",
        spot.x,
        spot.y,
      );
      reply.kind = "reply";
      reply.sourceId = source.id;
      reply.runId = runId;
      b.notes.push(reply);
    }
  }
  return actual;
}
export function diagramTemplate(kind: "architecture" | "storyboard") {
  const labels =
    kind === "architecture"
      ? [
          "Client / interface",
          "Application service",
          "Decision / queue",
          "Storage",
        ]
      : ["01 / Opening", "02 / Friction", "03 / The turn", "04 / Landing"];
  const nodes: DiagramNode[] = labels.map((label, i) => ({
    id: uid(),
    label,
    detail:
      kind === "storyboard"
        ? "What happens in this beat?"
        : "Describe this responsibility.",
    shape:
      kind === "storyboard"
        ? "frame"
        : i === 3
          ? "database"
          : i === 2
            ? "decision"
            : "step",
    x: 90 + i * 340,
    y: 180 + (kind === "architecture" && i % 2 ? 130 : 0),
  }));
  return {
    nodes,
    edges: nodes.slice(1).map((n, i) => ({
      id: uid(),
      from: nodes[i]!.id,
      to: n.id,
      label: kind === "storyboard" ? "then" : "",
    })),
  };
}
