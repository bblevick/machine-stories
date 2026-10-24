import * as T from "three";
import { makeBureau } from "./bureau";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { makeGeometry, disposeGeometry, orange, type Part } from "./geometry";
import {
  sampleMechanism,
  beltPoint,
  guideAt,
  type MechanismConfig,
} from "./math";
export interface ViewState {
  config: MechanismConfig;
  phase: number;
  exploded: number;
  guided: boolean;
  guideMs: number;
  memo: string;
}
export class Exhibit {
  renderer: T.WebGLRenderer;
  scene = new T.Scene();
  camera = new T.PerspectiveCamera(36, 1, 0.1, 100);
  controls: OrbitControls;
  root = new T.Group();
  parts: Part[] = [];
  signature = "";
  markers: T.Mesh[] = [];
  selected = "input";
  bureau: ReturnType<typeof makeBureau> | null = null;
  constructor(
    public host: HTMLElement,
    public onSelect: (key: string) => void,
  ) {
    this.renderer = new T.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setClearColor(0xe9e6d9);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = T.PCFShadowMap;
    host.append(this.renderer.domElement);
    this.renderer.domElement.setAttribute(
      "aria-label",
      "Interactive three-dimensional mechanism. Use the part buttons for keyboard selection.",
    );
    this.camera.position.set(2.5, 3.5, 10);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = false;
    this.controls.minDistance = 6;
    this.controls.maxDistance = 17;
    this.scene.add(new T.HemisphereLight(0xffffff, 0x626b55, 2.7));
    const light = new T.DirectionalLight(0xffffff, 3);
    light.position.set(-3, 5, 8);
    light.castShadow = true;
    light.shadow.mapSize.set(2048, 2048);
    this.scene.add(light);
    const rim = new T.DirectionalLight(0xffc38b, 1.4);
    rim.position.set(5, -3, 3);
    this.scene.add(rim);
    new ResizeObserver(() => this.resize()).observe(host);
    this.renderer.domElement.addEventListener("click", (e) => {
      const rect = host.getBoundingClientRect(),
        pointer = new T.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          (-(e.clientY - rect.top) / rect.height) * 2 + 1,
        ),
        ray = new T.Raycaster();
      ray.setFromCamera(pointer, this.camera);
      const hit = ray
        .intersectObjects(this.root.children, true)
        .find((h) => h.object.userData.key);
      if (hit) {
        this.selected = hit.object.userData.key;
        onSelect(this.selected);
      }
    });
    this.resize();
  }
  resize() {
    const w = this.host.clientWidth,
      h = this.host.clientHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }
  resetCamera() {
    this.camera.position.set(2.5, 3.5, 10);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }
  rebuild(c: MechanismConfig) {
    this.scene.remove(this.root);
    disposeGeometry(this.root);
    const made = makeGeometry(c);
    this.root = made.root;
    this.parts = made.parts;
    this.markers = [];
    if (c.id === "belt") {
      const belt = this.parts.find((p) => p.key === "belt")!.mesh;
      for (let i = 0; i < 18; i++) {
        const m = new T.Mesh(
          new T.SphereGeometry(0.067, 8, 8),
          new T.MeshStandardMaterial({ color: orange }),
        );
        belt.add(m);
        this.markers.push(m);
      }
    }
    this.bureau = makeBureau(c, "Call it a work in progress.");
    this.root.add(this.bureau.root);
    this.scene.add(this.root);
    this.signature = JSON.stringify(c);
  }
  renderAt(_timeMs: number, v: ViewState) {
    if (this.signature !== JSON.stringify(v.config)) this.rebuild(v.config);
    const poses = sampleMechanism(v.config, v.phase),
      exp = v.guided ? guideAt(v.guideMs).exploded : v.exploded;
    for (const p of this.parts) {
      const pose = poses[p.key];
      if (pose) {
        p.mesh.position.set(pose.x, pose.y, p.offset * exp);
        p.mesh.rotation.z = pose.angle;
      } else p.mesh.position.z = p.offset * exp;
      p.mesh.traverse((o) => {
        if (o instanceof T.Mesh) {
          const mat = o.material as T.MeshStandardMaterial;
          mat.emissive.setHex(p.key === this.selected ? 0x30200b : 0);
          mat.emissiveIntensity = 0.25;
        }
      });
    }
    if (v.config.id === "belt") {
      const len = 2 * v.config.spacing + 2 * Math.PI * 0.8;
      this.markers.forEach((m, i) => {
        const p = beltPoint(
          (i / 18) * len + v.phase * 2 * Math.PI * 0.8,
          v.config.spacing,
        );
        m.position.set(p.x, p.y, 0.08);
      });
    }
    this.bureau?.update(v.phase, poses, exp, v.memo);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
