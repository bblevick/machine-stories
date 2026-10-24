import * as T from "three";
import { beltPoint, type MechanismConfig } from "./math";
export const orange = 0xd65d2e,
  graphite = 0x354340;
export interface Part {
  key: string;
  name: string;
  description: string;
  mesh: T.Group;
  offset: number;
}
export function makeGeometry(c: MechanismConfig) {
  const parts: Part[] = [];
  const root = new T.Group();
  const metal = (color: number) =>
    new T.MeshStandardMaterial({ color, roughness: 0.38, metalness: 0.45 });
  function add(
    key: string,
    name: string,
    description: string,
    group: T.Group,
    offset: number,
  ) {
    group.userData.key = key;
    group.traverse((o) => {
      o.userData.key = key;
      if (o instanceof T.Mesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    root.add(group);
    parts.push({ key, name, description, mesh: group, offset });
    return group;
  }
  function axle(g: T.Group) {
    const m = new T.Mesh(
      new T.CylinderGeometry(0.13, 0.13, 0.95, 24),
      metal(0x9a9b8d),
    );
    m.rotation.x = Math.PI / 2;
    m.position.z = -0.12;
    g.add(m);
    const cap = new T.Mesh(
      new T.CylinderGeometry(0.21, 0.21, 0.07, 6),
      metal(0xe4e0cc),
    );
    cap.rotation.x = Math.PI / 2;
    cap.position.z = 0.27;
    g.add(cap);
  }
  function gear(teeth: number, r: number, color: number) {
    const g = new T.Group(),
      s = new T.Shape();
    for (let i = 0; i < teeth * 4; i++) {
      const a = (i / (teeth * 4)) * Math.PI * 2;
      const rad = r + ([0, 3].includes(i % 4) ? -0.06 : 0.06);
      const x = Math.cos(a) * rad,
        y = Math.sin(a) * rad;
      i ? s.lineTo(x, y) : s.moveTo(x, y);
    }
    s.closePath();
    const h = new T.Path();
    h.absarc(0, 0, 0.19, 0, Math.PI * 2, true);
    s.holes.push(h);
    const mesh = new T.Mesh(
      new T.ExtrudeGeometry(s, {
        depth: 0.3,
        bevelEnabled: true,
        bevelThickness: 0.025,
        bevelSize: 0.018,
        bevelSegments: 2,
        steps: 1,
      }),
      metal(color),
    );
    mesh.position.z = -0.15;
    g.add(mesh);
    for (let i = 0; i < 6; i++) {
      const hole = new T.Mesh(
        new T.CylinderGeometry(r * 0.12, r * 0.12, 0.015, 20),
        metal(0x192925),
      );
      hole.rotation.x = Math.PI / 2;
      hole.position.set(
        Math.cos((i * Math.PI) / 3) * r * 0.58,
        Math.sin((i * Math.PI) / 3) * r * 0.58,
        0.185,
      );
      g.add(hole);
    }
    axle(g);
    return g;
  }
  function pulley(color: number) {
    const g = new T.Group();
    for (const [r, z, depth] of [
      [0.8, 0, 0.24],
      [0.87, -0.14, 0.045],
      [0.87, 0.14, 0.045],
    ]) {
      const m = new T.Mesh(
        new T.CylinderGeometry(r, r, depth, 64),
        metal(color),
      );
      m.rotation.x = Math.PI / 2;
      m.position.z = z;
      g.add(m);
    }
    const stripe = new T.Mesh(
      new T.BoxGeometry(0.55, 0.055, 0.03),
      metal(0xece7d9),
    );
    stripe.position.set(0.33, 0, 0.18);
    g.add(stripe);
    axle(g);
    return g;
  }
  if (c.id === "gears") {
    add(
      "input",
      "Drive gear · 16 teeth",
      "The input shaft supplies rotation. Every tooth advances its partner by one tooth.",
      gear(16, 0.8, orange),
      0.5,
    );
    add(
      "output",
      `Driven gear · ${16 * c.ratio} teeth`,
      `The output turns in the opposite direction at 1/${c.ratio} of the input speed. The tooth profiles are illustrative.`,
      gear(16 * c.ratio, 0.8 * c.ratio, graphite),
      1.5,
    );
  }
  if (c.id === "crank") {
    const crank = new T.Group();
    const arm = new T.Mesh(
      new T.BoxGeometry(c.radius + 0.25, 0.22, 0.22),
      metal(orange),
    );
    arm.position.x = c.radius / 2;
    crank.add(arm);
    axle(crank);
    add(
      "input",
      "Crank",
      "The input shaft drives a pin in a circle. Its radius controls half the piston stroke.",
      crank,
      0.35,
    );
    const pin = new T.Group();
    const pm = new T.Mesh(
      new T.CylinderGeometry(0.14, 0.14, 0.5, 24),
      metal(0xe3c27d),
    );
    pm.rotation.x = Math.PI / 2;
    pin.add(pm);
    add(
      "pin",
      "Crank pin",
      "This joint joins the rotating crank to the connecting rod.",
      pin,
      1.5,
    );
    const rod = new T.Group();
    rod.add(
      new T.Mesh(new T.BoxGeometry(c.rodLength, 0.15, 0.18), metal(graphite)),
    );
    add(
      "rod",
      "Connecting rod",
      "A fixed-length rod transfers circular motion to the constrained slider.",
      rod,
      1,
    );
    const slider = new T.Group();
    slider.add(new T.Mesh(new T.BoxGeometry(0.6, 0.72, 0.4), metal(orange)));
    add(
      "slider",
      "Slider",
      "Constrained to one axis. Its stroke equals twice the crank radius.",
      slider,
      2,
    );
    const rail = new T.Mesh(
      new T.BoxGeometry(4.5, 0.12, 0.12),
      metal(0x969d8e),
    );
    rail.position.set(2, -0.55, -0.2);
    root.add(rail);
    root.position.x = -1.2;
  }
  if (c.id === "belt") {
    add(
      "input",
      "Drive pulley",
      "The input pulley pulls the belt along its closed path.",
      pulley(orange),
      0.5,
    );
    add(
      "output",
      "Driven pulley",
      "Equal pulley radii give equal angular speeds and the same direction of rotation.",
      pulley(graphite),
      1.5,
    );
    const pts = Array.from({ length: 241 }, (_, i) => {
      const p = beltPoint(
        (i / 240) * (2 * c.spacing + 2 * Math.PI * 0.8),
        c.spacing,
      );
      return new T.Vector3(p.x, p.y, 0);
    });
    const path = new T.CatmullRomCurve3(pts, true);
    const belt = new T.Group();
    belt.add(
      new T.Mesh(
        new T.TubeGeometry(path, 240, 0.045, 8, true),
        metal(0x202e2c),
      ),
    );
    add(
      "belt",
      "Transmission belt",
      "Markers move at the pulley rim speed along straight spans and semicircular ends.",
      belt,
      2,
    );
  }
  const plate = new T.Mesh(new T.BoxGeometry(7.8, 4.8, 0.18), metal(0xd9d6c5));
  plate.position.z = -0.75;
  plate.receiveShadow = true;
  root.add(plate);
  return { root, parts };
}
export function disposeGeometry(root: T.Object3D) {
  root.traverse((o) => {
    if (o instanceof T.Mesh) {
      o.geometry.dispose();
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => {
        (m as T.MeshStandardMaterial).map?.dispose();
        m.dispose();
      });
    }
  });
}
