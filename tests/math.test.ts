import { describe, it, expect } from "vitest";
import {
  defaults,
  sampleMechanism,
  beltPoint,
  guideAt,
  validateConfig,
} from "../src/math";
describe("mechanism relationships", () => {
  it("gear ratios reverse direction and close after the joint cycle", () => {
    for (const ratio of [1, 2, 3] as const) {
      const c = { ...defaults, ratio };
      const a = sampleMechanism(c, 0),
        b = sampleMechanism(c, 1),
        cycle = sampleMechanism(c, ratio);
      expect(b.output.angle - a.output.angle).toBeCloseTo(
        (-2 * Math.PI) / ratio,
      );
      expect(Math.cos(cycle.output.angle)).toBeCloseTo(
        Math.cos(a.output.angle),
      );
    }
  });
  it("slider endpoints and fixed connecting-rod length", () => {
    const c = { ...defaults, id: "crank" as const };
    expect(sampleMechanism(c, 0).slider.x).toBeCloseTo(3.3);
    expect(sampleMechanism(c, 0.5).slider.x).toBeCloseTo(1.7);
    for (let p = 0; p <= 1; p += 0.031) {
      const x = sampleMechanism(c, p);
      expect(Math.hypot(x.slider.x - x.pin.x, x.pin.y)).toBeCloseTo(
        c.rodLength,
      );
    }
  });
  it("equal pulleys turn together; belt path is continuous and periodic", () => {
    const c = { ...defaults, id: "belt" as const };
    expect(sampleMechanism(c, 0.3).input.angle).toBe(
      sampleMechanism(c, 0.3).output.angle,
    );
    const len = 2 * c.spacing + 2 * Math.PI * 0.8;
    expect(beltPoint(0, c.spacing)).toEqual(beltPoint(len, c.spacing));
    for (const s of [
      c.spacing,
      c.spacing + Math.PI * 0.8,
      2 * c.spacing + Math.PI * 0.8,
    ]) {
      const a = beltPoint(s - 1e-6, c.spacing),
        b = beltPoint(s + 1e-6, c.spacing);
      expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeLessThan(3e-6);
    }
  });
  it("rejects invalid geometry and samples", () => {
    expect(() => validateConfig({ ...defaults, rodLength: 0.2 })).toThrow();
    expect(() => sampleMechanism(defaults, NaN)).toThrow();
  });
  it("guide separates then reassembles", () => {
    expect(guideAt(0).exploded).toBe(0);
    expect(guideAt(11000).exploded).toBe(1);
    expect(guideAt(20000).exploded).toBe(0);
  });
});
