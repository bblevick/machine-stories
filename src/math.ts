export type MechanismId = "gears" | "crank" | "belt";
export interface MechanismConfig {
  id: MechanismId;
  ratio: 1 | 2 | 3;
  radius: number;
  rodLength: number;
  spacing: number;
  speed: number;
}
export const defaults: MechanismConfig = {
  id: "gears",
  ratio: 2,
  radius: 0.8,
  rodLength: 2.5,
  spacing: 3.4,
  speed: 1,
};
export interface Pose {
  x: number;
  y: number;
  angle: number;
}
export function validateConfig(c: MechanismConfig) {
  if (
    !["gears", "crank", "belt"].includes(c.id) ||
    ![1, 2, 3].includes(c.ratio) ||
    !Number.isFinite(c.radius) ||
    c.radius < 0.4 ||
    c.radius > 1 ||
    !Number.isFinite(c.rodLength) ||
    c.rodLength < 1.5 ||
    c.rodLength > 3.5 ||
    c.rodLength <= c.radius ||
    !Number.isFinite(c.spacing) ||
    c.spacing < 2.2 ||
    c.spacing > 4.5 ||
    !Number.isFinite(c.speed) ||
    c.speed < 0.25 ||
    c.speed > 2
  )
    throw Error("Mechanism parameters are outside their supported range.");
}
export function sampleMechanism(
  c: MechanismConfig,
  phase: number,
): Record<string, Pose> {
  validateConfig(c);
  if (!Number.isFinite(phase)) throw Error("Phase must be finite.");
  const a = phase * Math.PI * 2;
  if (c.id === "gears") {
    const d = 0.8 * (1 + c.ratio);
    return {
      input: { x: -d / 2, y: 0, angle: a },
      output: {
        x: d / 2,
        y: 0,
        angle: -a / c.ratio + Math.PI / (16 * c.ratio),
      },
    };
  }
  if (c.id === "belt")
    return {
      input: { x: -c.spacing / 2, y: 0, angle: a },
      output: { x: c.spacing / 2, y: 0, angle: a },
    };
  const pin = {
    x: c.radius * Math.cos(a),
    y: c.radius * Math.sin(a),
    angle: a,
  };
  const x = pin.x + Math.sqrt(c.rodLength ** 2 - pin.y ** 2);
  return {
    input: { x: 0, y: 0, angle: a },
    pin,
    slider: { x, y: 0, angle: 0 },
    rod: {
      x: (pin.x + x) / 2,
      y: pin.y / 2,
      angle: Math.atan2(-pin.y, x - pin.x),
    },
  };
}
export function beltPoint(distance: number, spacing: number, r = 0.8) {
  const total = 2 * spacing + 2 * Math.PI * r;
  let s = ((distance % total) + total) % total;
  if (s < spacing) return { x: -spacing / 2 + s, y: r };
  s -= spacing;
  if (s < Math.PI * r) {
    const a = Math.PI / 2 - s / r;
    return { x: spacing / 2 + r * Math.cos(a), y: r * Math.sin(a) };
  }
  s -= Math.PI * r;
  if (s < spacing) return { x: spacing / 2 - s, y: -r };
  s -= spacing;
  const a = -Math.PI / 2 - s / r;
  return { x: -spacing / 2 + r * Math.cos(a), y: r * Math.sin(a) };
}
export function guideAt(ms: number) {
  const t = Math.min(20, Math.max(0, ms / 1000));
  return {
    exploded:
      t < 5
        ? 0
        : t < 9
          ? (t - 5) / 4
          : t < 14
            ? 1
            : t < 18
              ? 1 - (t - 14) / 4
              : 0,
    chapter: t < 5 ? 0 : t < 10 ? 1 : t < 15 ? 2 : 3,
  };
}
