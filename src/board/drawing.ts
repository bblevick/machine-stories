import type { Board, DiagramNode, Stroke } from "./model";
export const INK_W = 1100,
  INK_H = 1600;
export function drawInk(
  canvas: HTMLCanvasElement,
  strokes: Stroke[],
  paper = true,
) {
  const ctx = canvas.getContext("2d")!;
  canvas.width = INK_W;
  canvas.height = INK_H;
  ctx.fillStyle = "#fcfaf2";
  ctx.fillRect(0, 0, INK_W, INK_H);
  if (paper) {
    ctx.fillStyle = "#c5cbbd";
    for (let y = 25; y < INK_H; y += 30)
      for (let x = 25; x < INK_W; x += 30) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
  }
  for (const stroke of strokes) drawStroke(canvas, stroke);
}
export function drawStroke(canvas: HTMLCanvasElement, s: Stroke, from = 0) {
  const ctx = canvas.getContext("2d")!;
  ctx.strokeStyle = s.color;
  ctx.fillStyle = s.color;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (from === 0 && s.points.length === 1) {
    const p = s.points[0]!;
    ctx.beginPath();
    ctx.arc(p.x, p.y, (s.width * (0.35 + 0.65 * p.p)) / 2, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = Math.max(1, from); i < s.points.length; i++) {
    const a = s.points[i - 1]!,
      b = s.points[i]!;
    ctx.lineWidth = s.width * (0.35 + (0.65 * (a.p + b.p)) / 2);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
}

export function hitsStroke(s: Stroke, x: number, y: number, radius = 20) {
  if (s.points.length === 1)
    return Math.hypot(s.points[0]!.x - x, s.points[0]!.y - y) < radius;
  return s.points.some((b, i) => {
    if (!i) return false;
    const a = s.points[i - 1]!,
      dx = b.x - a.x,
      dy = b.y - a.y,
      t = Math.max(
        0,
        Math.min(
          1,
          ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy || 1),
        ),
      );
    return (
      Math.hypot(x - a.x - dx * t, y - a.y - dy * t) < radius + s.width / 2
    );
  });
}
const NS = "http://www.w3.org/2000/svg";
function element(
  name: string,
  attrs: Record<string, string | number>,
  text?: string,
) {
  const e = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  if (text !== undefined) e.textContent = text;
  return e;
}
export function renderDiagram(
  svg: SVGSVGElement,
  b: Board,
  selected: string | null,
  connecting: string | null,
) {
  svg.replaceChildren();
  svg.setAttribute("viewBox", "0 0 1600 1100");
  svg.setAttribute("xmlns", NS);
  const defs = element("defs", {}),
    marker = element("marker", {
      id: "arrow",
      markerWidth: 10,
      markerHeight: 10,
      refX: 8,
      refY: 3,
      orient: "auto",
      markerUnits: "strokeWidth",
    });
  marker.append(element("path", { d: "M0,0 L0,6 L9,3 z", fill: "#56685e" }));
  defs.append(marker);
  svg.append(
    defs,
    element("rect", { width: 1600, height: 1100, fill: "#f6f3e8" }),
  );
  const pattern = element("pattern", {
    id: "dots",
    width: 30,
    height: 30,
    patternUnits: "userSpaceOnUse",
  });
  pattern.append(element("circle", { cx: 25, cy: 25, r: 1, fill: "#d6dbce" }));
  defs.append(pattern);
  svg.append(
    element("rect", { width: 1600, height: 1100, fill: "url(#dots)" }),
  );
  const nodeMap = new Map(b.diagram.nodes.map((n) => [n.id, n]));
  for (const e of b.diagram.edges) {
    const a = nodeMap.get(e.from)!,
      z = nodeMap.get(e.to)!,
      ax = a.x + 110,
      ay = a.y + 65,
      bx = z.x + 110,
      by = z.y + 65;
    let startX = ax,
      endX = bx,
      startY = ay,
      endY = by;
    if (Math.abs(bx - ax) > Math.abs(by - ay)) {
      startX += bx > ax ? 110 : -110;
      endX += bx > ax ? -117 : 117;
    } else {
      startY += by > ay ? 65 : -65;
      endY += by > ay ? -72 : 72;
    }
    const group = element("g", {
      "data-edge": e.id,
      tabindex: 0,
      role: "button",
      "aria-label": `Link ${a.label} to ${z.label}`,
    });
    group.append(
      element("path", {
        d: `M ${startX} ${startY} C ${(startX + endX) / 2} ${startY}, ${(startX + endX) / 2} ${endY}, ${endX} ${endY}`,
        fill: "none",
        stroke: e.id === selected ? "#bd6947" : "#75877a",
        "stroke-width": e.id === selected ? 4 : 2,
        "marker-end": "url(#arrow)",
      }),
    );
    if (e.label) {
      const tx = (startX + endX) / 2,
        ty = (startY + endY) / 2;
      group.append(
        element("rect", {
          x: tx - 62,
          y: ty - 14,
          width: 124,
          height: 24,
          fill: "#f6f3e8",
        }),
        element(
          "text",
          {
            x: tx,
            y: ty + 2,
            "text-anchor": "middle",
            "font-family": "Trebuchet MS",
            "font-size": 12,
            fill: "#526459",
          },
          e.label,
        ),
      );
    }
    svg.append(group);
  }
  for (const n of b.diagram.nodes) {
    const g = element("g", {
      "data-node": n.id,
      transform: `translate(${n.x} ${n.y})`,
      tabindex: 0,
      role: "button",
      "aria-label": `${n.shape}: ${n.label}`,
    });
    const attrs = {
      fill:
        n.shape === "frame"
          ? "#efdfc6"
          : n.shape === "decision"
            ? "#e4e9d5"
            : n.shape === "database"
              ? "#d8e5e1"
              : "#f2e5ad",
      stroke:
        n.id === selected
          ? "#bd6947"
          : n.id === connecting
            ? "#789a77"
            : "#a1ae9d",
      "stroke-width": n.id === selected || n.id === connecting ? 3 : 1,
    };
    if (n.shape === "decision")
      g.append(
        element("path", { d: "M110,0 L220,65 L110,130 L0,65 Z", ...attrs }),
      );
    else if (n.shape === "database") {
      g.append(
        element("path", {
          d: "M0,18 C0,-6 220,-6 220,18 L220,112 C220,136 0,136 0,112 Z",
          ...attrs,
        }),
        element("path", {
          d: "M0,18 C0,42 220,42 220,18",
          stroke: "#a1ae9d",
          fill: "none",
        }),
      );
    } else
      g.append(
        element("rect", {
          width: 220,
          height: 130,
          rx: n.shape === "frame" ? 1 : 8,
          ...attrs,
        }),
      );
    g.append(
      element(
        "text",
        {
          x: 110,
          y: 57,
          "text-anchor": "middle",
          "font-family": "Georgia",
          "font-size": 18,
          fill: "#344e43",
        },
        n.label.slice(0, 25),
      ),
      element(
        "text",
        {
          x: 110,
          y: 82,
          "text-anchor": "middle",
          "font-family": "Trebuchet MS",
          "font-size": 11,
          fill: "#68796a",
        },
        n.detail.slice(0, 34),
      ),
    );
    svg.append(g);
  }
  if (!b.diagram.nodes.length)
    svg.append(
      element(
        "text",
        {
          x: 800,
          y: 410,
          "text-anchor": "middle",
          "font-family": "Georgia",
          "font-size": 30,
          fill: "#91a08c",
        },
        "Give an idea a shape.",
      ),
    );
}
export function boardImage(b: Board) {
  const canvas = document.createElement("canvas");
  canvas.width = 2400;
  canvas.height = 1600;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#b6966c";
  ctx.fillRect(0, 0, 2400, 1600);
  ctx.fillStyle = "#f2e8d2";
  ctx.fillRect(55, 25, 600, 42);
  ctx.fillStyle = "#3e5344";
  ctx.font = "24px Georgia";
  ctx.fillText(b.title.slice(0, 60), 75, 55);
  for (const n of b.notes) {
    ctx.save();
    ctx.translate(n.x + 140, n.y + 100);
    ctx.rotate((n.rotation * Math.PI) / 180);
    ctx.translate(-140, -100);
    ctx.fillStyle = {
      butter: "#f1df9b",
      rose: "#ecc6ba",
      sage: "#d3dfbd",
      blue: "#c6dde0",
      paper: "#f8f3e2",
    }[n.color];
    ctx.shadowColor = "#3f2a2544";
    ctx.shadowBlur = 15;
    ctx.fillRect(0, 0, 280, 250);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#3b4d40";
    ctx.font = "bold 18px Georgia";
    ctx.fillText(n.title.slice(0, 29), 20, 40);
    ctx.font = "15px Trebuchet MS";
    const words = n.body.split(/\s+/);
    let line = "",
      y = 73;
    for (const word of words) {
      if (ctx.measureText(line + word).width > 235) {
        ctx.fillText(line, 20, y);
        line = "";
        y += 22;
        if (y > 220) break;
      }
      line += word + " ";
    }
    if (y <= 220) ctx.fillText(line, 20, y);
    ctx.restore();
  }
  return canvas;
}
