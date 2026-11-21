import { orientationToGravity } from './gravity.js';

export function createFallback({ canvas, betaInput, gammaInput }) {
  const state = {
    beta: 60,
    gamma: 0,
    gravity: orientationToGravity(60, 0, 0),
    t: 0
  };

  function onInput() {
    if (betaInput) state.beta = +betaInput.value;
    if (gammaInput) state.gamma = +gammaInput.value;
    state.gravity = orientationToGravity(state.beta, state.gamma, 0);
    state.t = performance.now();
  }

  if (betaInput) betaInput.addEventListener('input', onInput);
  if (gammaInput) gammaInput.addEventListener('input', onInput);

  let dragging = false;

  function applyPointer(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const vx = (clientX - rect.left) - rect.width / 2;
    const vy = (clientY - rect.top);
    const len = Math.hypot(vx, vy) || 1;
    state.gravity = { x: vx / len, y: vy / len };
    state.t = performance.now();
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
    dragging = true;
    applyPointer(e.clientX, e.clientY);
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    applyPointer(e.clientX, e.clientY);
  });

  function endDrag() {
    dragging = false;
  }

  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  return { state };
}
