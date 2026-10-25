import { describe, it, expect } from "vitest";
import {
  createBoard,
  newNote,
  validateBoard,
  History,
  applyRun,
  taskInput,
  diagramTemplate,
} from "../src/board/model";
import { hitsStroke } from "../src/board/drawing";
function sent() {
  const b = createBoard(),
    n = b.notes[0]!;
  n.task = {
    key: "request_1234567890",
    input: n.body,
    runId: "run_test",
    status: "running",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return { b, n };
}
describe("personal board and actual-run semantics", () => {
  it("round-trips original notes, diagrams, ink and immutable transfer copies", () => {
    const b = createBoard();
    b.diagram = diagramTemplate("architecture");
    b.strokes = [
      {
        id: "ink",
        color: "#123456",
        width: 4,
        points: [{ x: 10, y: 12, p: 0.5 }],
      },
    ];
    const copy = validateBoard(JSON.parse(JSON.stringify(b)));
    expect(copy).toEqual(b);
    copy.notes[0]!.body = "changed";
    expect(b.notes[0]!.body).not.toBe("changed");
  });
  it("rejects oversized, non-finite and dangling board geometry", () => {
    const b = createBoard();
    expect(() =>
      validateBoard({ ...b, notes: Array(81).fill(b.notes[0]) }),
    ).toThrow();
    expect(() =>
      validateBoard({ ...b, notes: [{ ...b.notes[0], x: Infinity }] }),
    ).toThrow();
    expect(() =>
      validateBoard({
        ...b,
        diagram: {
          nodes: [],
          edges: [{ id: "bad", from: "x", to: "y", label: "" }],
        },
      }),
    ).toThrow();
    expect(() =>
      validateBoard({
        ...b,
        strokes: [{ id: "a", color: "url(evil)", width: 3, points: [] }],
      }),
    ).toThrow();
  });
  it("only attaches the selected note and explicitly selected context", () => {
    const b = createBoard();
    b.diagram = diagramTemplate("storyboard");
    b.notes[1]!.body = "UNSELECTED PRIVATE TEXT";
    const input = taskInput(b.notes[0]!, b, false, false);
    expect(input).not.toContain("UNSELECTED PRIVATE TEXT");
    expect(input).not.toContain("Attached diagram");
    expect(taskInput(b.notes[0]!, b, true, false)).toContain(
      "Attached diagram",
    );
    expect(input).not.toContain("Whiteboard ink");
  });
  it("pins exactly one real response per run receipt and preserves source text", () => {
    const { b, n } = sent(),
      source = n.body;
    applyRun(b, n, { status: "running", output: "interim" });
    expect(b.notes).toHaveLength(3);
    applyRun(b, n, { status: "completed", output: "Actual returned result" });
    applyRun(b, n, { status: "completed", output: "Actual returned result" });
    expect(b.notes).toHaveLength(4);
    expect(b.notes[3]).toMatchObject({
      kind: "reply",
      runId: "run_test",
      sourceId: n.id,
      body: "Actual returned result",
    });
    expect(n.body).toBe(source);
  });
  it("does not turn cancelled, failed, unknown or partial runs into successful replies", () => {
    for (const status of [
      "failed",
      "cancelled",
      "interrupted",
      "unknown",
      "waiting_for_approval",
    ]) {
      const { b, n } = sent();
      expect(applyRun(b, n, { status, output: "Diagnostic text" })).toBe(
        status,
      );
      expect(b.notes).toHaveLength(3);
    }
    const { b, n } = sent();
    applyRun(b, n, {
      status: "completed",
      finish_reason: "length",
      output: "Partial result",
    });
    expect(n.task!.status).toBe("incomplete");
    expect(b.notes[3]!.title).toContain("partial");
    const empty = sent();
    applyRun(empty.b, empty.n, { status: "completed", output: "" });
    expect(empty.n.task!.status).toBe("unknown");
  });
  it("undo/redo preserve independent copies and vector eraser tests segments", () => {
    const b = createBoard(),
      h = new History();
    h.push(b);
    b.notes.push(newNote());
    const old = h.undo(b)!;
    expect(old.notes).toHaveLength(3);
    expect(h.redo(old)!.notes).toHaveLength(4);
    const stroke = {
      id: "s",
      color: "#111111",
      width: 2,
      points: [
        { x: 0, y: 0, p: 0.5 },
        { x: 100, y: 0, p: 0.5 },
      ],
    };
    expect(hitsStroke(stroke, 50, 0)).toBe(true);
    expect(hitsStroke(stroke, 50, 100)).toBe(false);
  });
});
