import { CONFIG } from './config.js';
import { Chain } from './physics.js';
import { fitCanvas, draw } from './render.js';
import { createSensors } from './sensors.js';
import { createFallback } from './fallback.js';
import { initHud } from './hud.js';

const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');
const els = {
  status: document.getElementById('status'),
  btn: document.getElementById('btn-sensors'),
  readout: document.getElementById('readout'),
  hint: document.getElementById('hint')
};
const betaInput = document.getElementById('sl-beta');
const gammaInput = document.getElementById('sl-gamma');

let view = fitCanvas(canvas);
const ANCHOR_Y = 40;
const linkLen = Math.max(12, Math.min(32, view.h * 0.7 / CONFIG.LINKS));
const chain = new Chain({ links: CONFIG.LINKS, linkLen, anchor: { x: view.w / 2, y: ANCHOR_Y } });
const sensors = createSensors();
const fallback = createFallback({ canvas, betaInput, gammaInput });
const hud = initHud({ sensors, fallback, els });

window.addEventListener('resize', () => {
  view = fitCanvas(canvas);
  chain.setAnchor(view.w / 2, ANCHOR_Y);
});

function source() {
  return sensors.state.t > fallback.state.t ? 'sensor' : 'manual';
}

let frame = 0;
let fpsDt = 1 / 60;

function tick(dt) {
  dt = Math.min(dt, CONFIG.MAX_DT);
  const src = source();
  const g = src === 'sensor' ? sensors.state.gravity : fallback.state.gravity;
  let fx = g.x * CONFIG.G_PX;
  let fy = g.y * CONFIG.G_PX;
  if (sensors.state.accelT > 0 && performance.now() - sensors.state.accelT < 150) {
    fx += sensors.state.accel.x * CONFIG.ACCEL_SCALE;
    fy += sensors.state.accel.y * CONFIG.ACCEL_SCALE;
  }
  chain.step(dt, fx, fy, { w: view.w, h: view.h });
  frame++;
}

let last = null;
function loop(ts) {
  const dt = last === null ? 1 / 60 : (ts - last) / 1000;
  last = ts;
  fpsDt += (dt - fpsDt) * 0.1;
  tick(dt);
  draw(ctx, chain, view);
  if (frame % 6 === 0) hud.update(source());
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

window.__chain = {
  get links() { return chain.links; },
  get anchor() { return chain.anchor; },
  linkLen,
  get tip() { return chain.tip; },
  maxStretch: () => chain.maxStretch(),
  minGap: () => chain.minGap(),
  step(n) { for (let i = 0; i < n; i++) tick(1 / 60); },
  reset() { chain.reset(); },
  fps: () => 1 / fpsDt,
  get frame() { return frame; },
  get source() { return source(); },
  get gravity() { return source() === 'sensor' ? sensors.state.gravity : fallback.state.gravity; },
  get bounds() { return { w: view.w, h: view.h }; }
};
window.__sensors = sensors;
window.__fallback = fallback;
