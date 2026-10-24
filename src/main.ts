import { cases } from "./bureau";
import "./style.css";
import { $, download } from "./utils";
import { defaults, guideAt, type MechanismConfig } from "./math";
import { Exhibit, type ViewState } from "./scene";
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const names = {
  gears: "Spur gears",
  crank: "Slider–crank",
  belt: "Belt drive",
};
const app = $("app");
app.innerHTML = `<header><a class="brand" href="./">B<span>↗</span>M <b>BUREAU OF SMALL MACHINES</b></a><span class="edition">OPEN FOR UNFINISHED BUSINESS</span><a href="#about" class="small-link">FIELD NOTES ↗</a></header>
<main><section class="intro"><div><p class="eyebrow">THREE MACHINES. NO USEFUL WORK.</p><h1>For the things<br>you’re <em>not quite done</em> with.</h1></div><p class="dek">Slow a thought. Find a second wind.<br>Send something absolutely nowhere.</p></section><section class="filing-desk"><span class="desk-label">INTERNAL CORRESPONDENCE / NEVER SENT</span><label for="case-note">An unfinished thought</label><input id="case-note" maxlength="48" value="Call it a work in progress."><button id="file-note">File this thought ↗</button><span class="stamp">NOT<br>URGENT</span></section>
<section class="exhibit" aria-label="Mechanism exhibit"><div class="stage-wrap"><div class="stage-head"><span id="stage-title">01 / SPUR GEARS</span><span class="live"><i></i> ANALYTICAL MOTION</span></div><div id="stage"></div><div class="stage-foot"><span>DRAG TO ORBIT · SCROLL TO ZOOM</span><button id="camera-reset" class="text-button">↺ RESET VIEW</button></div><div id="loading" role="status">Preparing the exhibit…</div></div>
<aside><div class="tabs" aria-label="Mechanism"><button data-id="gears" aria-pressed="true">01<br><b>Gears</b></button><button data-id="crank" aria-pressed="false">02<br><b>Crank</b></button><button data-id="belt" aria-pressed="false">03<br><b>Belt</b></button></div><div class="panel"><p class="eyebrow" id="case-number">CASE FILE 001</p><h2 id="case-name">The Patience Regulator</h2><p id="case-brief" class="case-brief">For thoughts arriving faster than you can use them.</p><p class="eyebrow">UNDER THE DESK</p><h2 id="mechanism-name">Spur gears</h2><div id="parameters"></div><label class="range-label" for="explode">Separate the parts <output id="explode-value">0%</output></label><input id="explode" type="range" min="0" max="1" step=".01" value="0"><div class="divider"></div><div class="part-heading">INSPECT A PART <span>↙ CLICK THE MODEL</span></div><div id="parts" class="parts"></div><h3 id="part-name"></h3><p id="part-description" class="part-description"></p><button id="guide" class="primary">▶ Take the 20-second tour</button><p id="chapter" role="status" class="chapter">A little motion. A bigger idea.</p></div></aside></section>
<section class="bureau-dispatch"><span id="bureau-outcome">Nothing has been solved. It is simply moving more slowly.</span><output id="bureau-meter">1 INPUT TURN → ½ OUTPUT TURN</output></section><section class="transport"><button id="play" class="play" aria-label="Pause animation">Ⅱ</button><div class="scrub"><label for="phase">INPUT ROTATION <output id="phase-value">0°</output></label><input id="phase" type="range" min="0" max="3" step=".001" value="0"></div><button id="reset">↺ Reset</button><button id="capture">↓ Save image</button></section>
<section class="notes" id="about"><div><p class="eyebrow">THE BUREAU’S POSITION</p><h2>Excellent machinery.<br>Questionable productivity.</h2></div><p>The Bureau builds precise little machines for imprecise human situations. Your note stays on this device. Beneath the stationery: procedural 3D geometry, real gear ratios, fixed-length rods, and a closed belt path. The metaphors are fanciful; the motion is calculated. Gear teeth are illustrative.</p><p class="shortcuts">KEYBOARD<br><kbd>Space</kbd> Play / pause<br><kbd>←</kbd> <kbd>→</kbd> Scrub the cycle<br><kbd>E</kbd> Explode <kbd>G</kbd> Guided tour</p></section></main><footer><span>BUILT WITH AI. DIRECTED BY BEN LEVICKI.</span><span>DEPARTMENT OF VERY SMALL PROGRESS</span></footer>`;
const state: ViewState = {
  config: { ...defaults },
  phase: 0,
  exploded: 0,
  guided: false,
  guideMs: 0,
  memo: "Call it a work in progress.",
};
let playing = !reduced;
let exhibit: Exhibit;
function input(id: string) {
  return $<HTMLInputElement>(id);
}
function showError(e: unknown) {
  $("loading").hidden = false;
  $("loading").textContent =
    `Exhibit unavailable: ${e instanceof Error ? e.message : String(e)}. Reload to try again.`;
}
try {
  exhibit = new Exhibit($("stage"), selectPart);
  $("loading").hidden = true;
} catch (e) {
  showError(e);
  throw e;
}
function selectPart(key: string) {
  const part = exhibit.parts.find((p) => p.key === key) || exhibit.parts[0];
  if (!part) return;
  exhibit.selected = part.key;
  $("part-name").textContent = part.name;
  $("part-description").textContent = part.description;
  document
    .querySelectorAll<HTMLButtonElement>("[data-part]")
    .forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.part === part.key)),
    );
}
function render() {
  exhibit.renderAt(0, state);
  const file = cases[state.config.id];
  $("case-name").textContent = file.name;
  $("case-brief").textContent = file.brief;
  $("case-number").textContent =
    `CASE FILE 00${["gears", "crank", "belt"].indexOf(state.config.id) + 1}`;
  $("bureau-outcome").textContent = file.outcome;
  $("bureau-meter").textContent =
    state.config.id === "gears"
      ? `1 INPUT TURN → 1/${state.config.ratio} OUTPUT TURN`
      : state.config.id === "crank"
        ? `${(state.config.radius * 2).toFixed(1)} UNITS OF SECOND WIND`
        : `${Math.floor((state.phase * 2 * Math.PI * 0.8) / (2 * state.config.spacing + 2 * Math.PI * 0.8))} COMPLETE ROUNDS OF INTERNAL MAIL`;
  input("phase").value = String(state.phase % 3);
  $("phase-value").textContent = `${Math.round((state.phase % 1) * 360)}°`;
  $("play").textContent = playing ? "Ⅱ" : "▶";
  $("play").setAttribute(
    "aria-label",
    playing ? "Pause animation" : "Play animation",
  );
  const exp = state.guided ? guideAt(state.guideMs).exploded : state.exploded;
  input("explode").value = String(exp);
  $("explode-value").textContent = `${Math.round(exp * 100)}%`;
}
function bindParameters() {
  const c = state.config;
  $("parameters").innerHTML =
    c.id === "gears"
      ? `<label for="ratio">Tooth ratio</label><select id="ratio"><option value="1">16 : 16 · 1:1</option><option value="2">16 : 32 · 2:1</option><option value="3">16 : 48 · 3:1</option></select><p class="parameter-note">One input turn → <strong id="ratio-note">${(360 / c.ratio).toFixed(0)}°</strong> in the opposite direction.</p>`
      : c.id === "crank"
        ? `<label class="range-label" for="radius">Crank radius <output id="radius-out">${c.radius.toFixed(1)}</output></label><input id="radius" type="range" min=".4" max="1" step=".1" value="${c.radius}"><label class="range-label" for="rodLength">Rod length <output id="rodLength-out">${c.rodLength.toFixed(1)}</output></label><input id="rodLength" type="range" min="1.5" max="3.5" step=".1" value="${c.rodLength}">`
        : `<label class="range-label" for="spacing">Pulley spacing <output id="spacing-out">${c.spacing.toFixed(1)}</output></label><input id="spacing" type="range" min="2.2" max="4.5" step=".1" value="${c.spacing}">`;
  if (c.id === "gears") {
    $<HTMLSelectElement>("ratio").value = String(c.ratio);
    $("ratio").addEventListener("change", () => {
      c.ratio = Number(input("ratio").value) as 1 | 2 | 3;
      $("ratio-note").textContent = `${(360 / c.ratio).toFixed(0)}°`;
      refreshParts();
    });
  }
  for (const key of ["radius", "rodLength", "spacing"] as const) {
    const el = document.getElementById(key) as HTMLInputElement | null;
    el?.addEventListener("input", () => {
      c[key] = Number(el.value);
      $(`${key}-out`).textContent = c[key].toFixed(1);
      refreshParts();
    });
  }
  const label = document.createElement("label");
  label.className = "range-label";
  label.htmlFor = "speed";
  label.innerHTML = `Input speed <output id="speed-out">${c.speed.toFixed(2)}×</output>`;
  $("parameters").append(label);
  const speed = document.createElement("input");
  speed.type = "range";
  speed.id = "speed";
  speed.min = ".25";
  speed.max = "2";
  speed.step = ".25";
  speed.value = String(c.speed);
  speed.addEventListener("input", () => {
    c.speed = Number(speed.value);
    $("speed-out").textContent = `${c.speed.toFixed(2)}×`;
  });
  $("parameters").append(speed);
}
function refreshParts() {
  render();
  $("parts").replaceChildren(
    ...exhibit.parts.map((p) => {
      const b = document.createElement("button");
      b.textContent = p.name.split(" · ")[0];
      b.dataset.part = p.key;
      b.onclick = () => selectPart(p.key);
      return b;
    }),
  );
  selectPart(exhibit.selected);
}
function stopGuide() {
  state.guided = false;
  state.guideMs = 0;
  $("guide").textContent = "▶ Take the 20-second tour";
  $("chapter").textContent = "A little motion. A bigger idea.";
  input("phase").disabled = false;
  input("explode").disabled = false;
}
function guide() {
  state.guided = true;
  state.guideMs = 0;
  playing = true;
  state.phase = 0;
  input("phase").disabled = true;
  input("explode").disabled = true;
  $("guide").textContent = "↺ Restart the tour";
}
document.querySelectorAll<HTMLButtonElement>("[data-id]").forEach(
  (b) =>
    (b.onclick = () => {
      stopGuide();
      state.config.id = b.dataset.id as MechanismConfig["id"];
      state.phase = 0;
      state.exploded = 0;
      exhibit.selected = "input";
      $("mechanism-name").textContent = names[state.config.id];
      $("stage-title").textContent =
        `0${["gears", "crank", "belt"].indexOf(state.config.id) + 1} / ${names[state.config.id].toUpperCase()}`;
      document
        .querySelectorAll("[data-id]")
        .forEach((el) => el.setAttribute("aria-pressed", String(el === b)));
      bindParameters();
      refreshParts();
    }),
);
$("play").onclick = () => {
  playing = !playing;
  render();
};
$("guide").onclick = guide;
$("camera-reset").onclick = () => {
  exhibit.resetCamera();
  render();
};
input("explode").oninput = () => {
  state.exploded = Number(input("explode").value);
  render();
};
input("phase").oninput = () => {
  playing = false;
  state.phase = Number(input("phase").value);
  render();
};
$("reset").onclick = () => {
  stopGuide();
  state.config = { ...defaults };
  state.phase = 0;
  state.exploded = 0;
  playing = false;
  document.querySelector<HTMLButtonElement>('[data-id="gears"]')!.click();
  exhibit.resetCamera();
  render();
};
$("capture").onclick = () => {
  render();
  download(
    exhibit.renderer.domElement.toDataURL("image/png"),
    `machine-stories-${state.config.id}.png`,
  );
};
document.addEventListener("keydown", (e) => {
  if ((e.target as HTMLElement).matches("input,select,textarea,button,a"))
    return;
  if (e.code === "Space") {
    e.preventDefault();
    playing = !playing;
  }
  if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
    e.preventDefault();
    stopGuide();
    playing = false;
    state.phase += e.key === "ArrowRight" ? 0.01 : -0.01;
    state.phase = Math.max(0, state.phase);
  }
  if (e.key.toLowerCase() === "e") {
    stopGuide();
    state.exploded = state.exploded > 0.5 ? 0 : 1;
  }
  if (e.key.toLowerCase() === "g") guide();
  render();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    playing = false;
    render();
  }
});
$("file-note").onclick = () => {
  state.memo =
    input("case-note").value.trim() || "An unnamed unfinished thought.";
  if (state.config.id !== "belt")
    document.querySelector<HTMLButtonElement>('[data-id="belt"]')!.click();
  playing = !reduced;
  render();
};
bindParameters();
refreshParts();
let previous = performance.now();
function tick(now: number) {
  const dt = Math.min(100, now - previous);
  previous = now;
  if (playing) {
    state.phase += (dt / 6000) * state.config.speed;
    if (state.guided) {
      state.guideMs = Math.min(20000, state.guideMs + dt);
      state.phase = state.guideMs / 6000;
      const chapters = [
        "01 / Assembled: follow the input shaft.",
        "02 / Separated: inspect the moving parts.",
        "03 / Relationship: select a part to understand its role.",
        "04 / Together again: one elegant system.",
      ];
      $("chapter").textContent = chapters[guideAt(state.guideMs).chapter];
      exhibit.selected =
        state.guideMs < 10000
          ? "input"
          : state.config.id === "crank"
            ? "slider"
            : "output";
      if (state.guideMs === 20000) {
        playing = false;
        state.exploded = 0;
        stopGuide();
        $("chapter").textContent =
          "Tour complete. Explore the parts at your own pace.";
      }
    }
  }
  render();
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
(window as any).machineStories = {
  state,
  renderAt: (ms: number) => {
    playing = false;
    state.phase = ms / 6000;
    render();
  },
  guideAt: (ms: number) => {
    playing = false;
    state.guided = true;
    state.guideMs = ms;
    state.phase = ms / 6000;
    render();
  },
  select: (id: string) =>
    document.querySelector<HTMLButtonElement>(`[data-id="${id}"]`)?.click(),
};
