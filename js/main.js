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
let shake = { x: 0, y: 0 };
let lastAccelT = sensors.state.accelT;

function tick(dt) {
  dt = Math.min(dt, CONFIG.MAX_DT);
  const src = source();
  const g = src === 'sensor' ? sensors.state.gravity : fallback.state.gravity;
  if (src === 'sensor' && sensors.state.accelT !== lastAccelT) {
    shake.x = sensors.state.accel.x;
    shake.y = sensors.state.accel.y;
  }
  lastAccelT = sensors.state.accelT;
  const decay = Math.pow(0.9, dt * 60);
  shake.x *= decay;
  shake.y *= decay;
  const fx = g.x * CONFIG.G_PX + shake.x * CONFIG.ACCEL_SCALE * 3;
  const fy = g.y * CONFIG.G_PX + shake.y * CONFIG.ACCEL_SCALE * 3;
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
  get bounds() { return { w: view.w, h: view.h }; },
  get shake() { return { x: shake.x, y: shake.y }; }
};
window.__sensors = sensors;
window.__fallback = fallback;
