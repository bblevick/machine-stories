import * as T from "three";
import { beltPoint, type MechanismConfig, type Pose } from "./math";
export const cases = {
  gears: {
    name: "The Patience Regulator",
    brief: "For thoughts arriving faster than you can use them.",
    outcome: "Nothing has been solved. It is simply moving more slowly.",
    stamp: "DEFERRED",
  },
  crank: {
    name: "The Second-Wind Engine",
    brief: "A small mechanical breath for an unfinished afternoon.",
    outcome: "One circle becomes one more attempt.",
    stamp: "STILL TRYING",
  },
  belt: {
    name: "The Circular Mailroom",
    brief: "Send an unfinished thought on a journey to exactly where it began.",
    outcome: "No destination. Impeccable circulation.",
    stamp: "RETURN TO SELF",
  },
};
function paper(text: string, stamp: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 384;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#f2e8c8";
  ctx.fillRect(0, 0, 768, 384);
  ctx.strokeStyle = "#beb599";
  ctx.lineWidth = 3;
  ctx.strokeRect(12, 12, 744, 360);
  ctx.fillStyle = "#465344";
  ctx.font = "20px monospace";
  ctx.fillText("BUREAU OF SMALL MACHINES / INTERNAL MAIL", 36, 48);
  ctx.font = "italic 40px Georgia";
  const words = text.split(" ");
  let line = "",
    y = 122;
  for (const word of words) {
    if (ctx.measureText(line + word).width > 680) {
      ctx.fillText(line, 36, y);
      y += 49;
      line = "";
    }
    line += word + " ";
  }
  ctx.fillText(line, 36, y);
  ctx.save();
  ctx.translate(555, 300);
  ctx.rotate(-0.12);
  ctx.strokeStyle = "#a94a31";
  ctx.lineWidth = 4;
  ctx.strokeRect(-150, -27, 300, 54);
  ctx.fillStyle = "#a94a31";
  ctx.textAlign = "center";
  ctx.font = "bold 23px monospace";
  ctx.fillText(stamp, 0, 8);
  ctx.restore();
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  return texture;
}
export function makeBureau(c: MechanismConfig, memo: string) {
  const root = new T.Group(),
    letters: T.Mesh[] = [],
    folds: T.Mesh[] = [];
  let text = memo;
  const material = new T.MeshBasicMaterial({
    map: paper(text, cases[c.id].stamp),
    side: T.DoubleSide,
  });
  const quantity = c.id === "belt" ? 3 : 1;
  for (let i = 0; i < quantity; i++) {
    const letter = new T.Mesh(
      new T.BoxGeometry(
        c.id === "belt" ? 1.15 : 1.7,
        c.id === "belt" ? 0.58 : 0.85,
        0.045,
      ),
      material,
    );
    letter.castShadow = true;
    root.add(letter);
    letters.push(letter);
  }
  const steel = new T.MeshStandardMaterial({
    color: 0x536158,
    metalness: 0.25,
    roughness: 0.6,
  });
  for (const x of [-3.55, 3.55])
    for (const y of [-2.1, 2.1]) {
      const screw = new T.Mesh(
        new T.CylinderGeometry(0.065, 0.065, 0.06, 6),
        steel,
      );
      screw.rotation.x = Math.PI / 2;
      screw.position.set(x, y, -0.6);
      root.add(screw);
    }
  if (c.id === "crank") {
    for (let i = 0; i < 9; i++) {
      const fold = new T.Mesh(
        new T.BoxGeometry(0.08, 0.72, 0.5),
        new T.MeshStandardMaterial({
          color: i % 2 ? 0xa79b69 : 0xe6d8a0,
          roughness: 0.9,
        }),
      );
      fold.castShadow = true;
      root.add(fold);
      folds.push(fold);
    }
  }
  return {
    root,
    update(
      phase: number,
      poses: Record<string, Pose>,
      exploded: number,
      nextMemo: string,
    ) {
      if (text !== nextMemo) {
        text = nextMemo;
        material.map?.dispose();
        material.map = paper(text, cases[c.id].stamp);
        material.needsUpdate = true;
      }
      if (c.id === "belt") {
        const length = 2 * c.spacing + 2 * Math.PI * 0.8;
        letters.forEach((letter, i) => {
          const distance = phase * 2 * Math.PI * 0.8 + (i * length) / 3,
            p = beltPoint(distance, c.spacing),
            ahead = beltPoint(distance + 0.001, c.spacing);
          letter.position.set(p.x, p.y, 0.3 + exploded * 2);
          letter.rotation.z = Math.atan2(ahead.y - p.y, ahead.x - p.x);
        });
      } else {
        letters[0].position.set(c.id === "crank" ? 1.7 : 0, -1.65, 0.05);
        letters[0].rotation.z = -0.06;
        if (c.id === "crank") {
          const from = poses.slider.x + 0.3,
            to = c.rodLength + c.radius + 0.8;
          folds.forEach((fold, i) => {
            fold.position.set(
              from + ((to - from) * (i + 0.5)) / 9,
              0,
              0.03 + exploded * 1.8,
            );
            fold.rotation.y = (i % 2 ? 1 : -1) * 0.25;
          });
        }
      }
    },
  };
}
