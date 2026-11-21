import {CONFIG} from './config.js';

export class Chain {
  constructor({links: n, linkLen, anchor}) {
    this.n = n;
    this.linkLen = linkLen;
    this.anchor = {x: anchor.x, y: anchor.y};
    this.links = [];
    for (let i = 0; i < n; i++) {
      const x = this.anchor.x;
      const y = this.anchor.y + (i + 1) * linkLen;
      this.links.push({x, y, px: x, py: y});
    }
  }

  reset() {
    for (let i = 0; i < this.n; i++) {
      const x = this.anchor.x;
      const y = this.anchor.y + (i + 1) * this.linkLen;
      this.links[i].x = x;
      this.links[i].y = y;
      this.links[i].px = x;
      this.links[i].py = y;
    }
  }

  setAnchor(x, y) {
    this.anchor.x = x;
    this.anchor.y = y;
  }

  step(dt, gx, gy, bounds) {
    const h = dt / CONFIG.SUBSTEPS;
    for (let s = 0; s < CONFIG.SUBSTEPS; s++) {
      for (let i = 0; i < this.n; i++) {
        const p = this.links[i];
        const vx = (p.x - p.px) * CONFIG.DAMPING;
        const vy = (p.y - p.py) * CONFIG.DAMPING;
        p.px = p.x;
        p.py = p.y;
        p.x += vx + gx * h * h;
        p.y += vy + gy * h * h;
      }
      const minDist = CONFIG.MIN_GAP * this.linkLen;
      for (let i = 0; i < this.n; i++) {
        for (let j = i + 3; j < this.n; j++) {
          const a = this.links[i];
          const b = this.links[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d = Math.hypot(dx, dy);
          if (d === 0 || d >= minDist) continue;
          const push = (minDist - d) / 2;
          const nx = dx / d;
          const ny = dy / d;
          a.x -= nx * push;
          a.y -= ny * push;
          b.x += nx * push;
          b.y += ny * push;
        }
      }
      for (let it = 0; it < CONFIG.ITERATIONS; it++) {
        for (let i = 0; i < this.n; i++) this._constrain(i);
        for (let i = this.n - 1; i >= 0; i--) this._constrain(i);
      }
      for (let i = 0; i < this.n; i++) {
        const p = this.links[i];
        if (p.x < 0) p.x = 0;
        else if (p.x > bounds.w) p.x = bounds.w;
        if (p.y < 0) p.y = 0;
        else if (p.y > bounds.h) p.y = bounds.h;
      }
    }
    for (let i = 0; i < this.n; i++) {
      const p = this.links[i];
      if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) {
        this.reset();
        return;
      }
    }
  }

  _constrain(i) {
    const a = i === 0 ? this.anchor : this.links[i - 1];
    const b = this.links[i];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.hypot(dx, dy);
    if (d === 0) return;
    const k = (d - this.linkLen) / d;
    if (i === 0) {
      b.x -= k * dx;
      b.y -= k * dy;
    } else {
      const ax = 0.5 * k * dx;
      const ay = 0.5 * k * dy;
      a.x += ax;
      a.y += ay;
      b.x -= ax;
      b.y -= ay;
    }
  }

  get tip() {
    return this.links[this.n - 1];
  }

  maxStretch() {
    let max = 0;
    for (let i = 0; i < this.n; i++) {
      const a = i === 0 ? this.anchor : this.links[i - 1];
      const b = this.links[i];
      const d = Math.hypot(b.x - a.x, b.y - a.y);
      const s = d / this.linkLen;
      if (s > max) max = s;
    }
    return max;
  }

  minGap() {
    if (this.n < 4) return Infinity;
    let min = Infinity;
    for (let i = 0; i < this.n; i++) {
      for (let j = i + 3; j < this.n; j++) {
        const a = this.links[i];
        const b = this.links[j];
        const d = Math.hypot(b.x - a.x, b.y - a.y);
        if (d < min) min = d;
      }
    }
    return min;
  }
}
