import { CONFIG } from './config.js';
import { orientationToGravity } from './gravity.js';

export function createSensors() {
  const state = {
    status: '',
    beta: null,
    gamma: null,
    gravity: { x: 0, y: 1 },
    accel: { x: 0, y: 0 },
    accelT: 0,
    t: 0
  };

  let attached = false;
  let firstValid = true;

  function onOri(e) {
    if (e.beta == null || e.gamma == null) return;
    const angle = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
    const raw = orientationToGravity(e.beta, e.gamma, angle);
    if (firstValid) {
      state.gravity = { x: raw.x, y: raw.y };
      firstValid = false;
    } else {
      state.gravity.x += (raw.x - state.gravity.x) * CONFIG.LP;
      state.gravity.y += (raw.y - state.gravity.y) * CONFIG.LP;
    }
    state.beta = e.beta;
    state.gamma = e.gamma;
    state.t = performance.now();
    state.status = 'active';
  }

  function onMot(e) {
    const a = e.acceleration;
    if (!a || a.x == null || a.y == null) return;
    state.accel = { x: -a.x, y: a.y };
    state.accelT = performance.now();
  }

  function attach() {
    if (attached) return;
    attached = true;
    window.addEventListener('deviceorientation', onOri);
    window.addEventListener('devicemotion', onMot);
    setTimeout(() => {
      if (state.status === 'listening') state.status = 'no-sensor';
    }, CONFIG.NO_SENSOR_MS);
  }

  async function requestPermission() {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      state.status = 'requesting';
      try {
        const r1 = DeviceOrientationEvent.requestPermission();
        const r2 = (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function')
          ? DeviceMotionEvent.requestPermission()
          : Promise.resolve('granted');
        const res = await Promise.all([r1, r2]);
        if (res[0] === 'granted' && res[1] === 'granted') {
          attach();
          state.status = state.t > 0 ? 'active' : 'listening';
        } else {
          state.status = 'denied';
        }
      } catch {
        state.status = 'denied';
      }
    } else {
      attach();
    }
    return state.status;
  }

  if (typeof DeviceOrientationEvent === 'undefined') {
    state.status = 'unsupported';
  } else if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    state.status = 'needs-permission';
  } else {
    attach();
    state.status = 'listening';
  }

  return { state, requestPermission };
}
