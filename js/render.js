function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, rr);
    return;
  }
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  ctx.lineTo(x + rr, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr, rr);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.closePath();
}

export function fitCanvas(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  return { w, h, dpr };
}

export function draw(ctx, chain, view) {
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);

  const bg = ctx.createLinearGradient(0, 0, 0, view.h);
  bg.addColorStop(0, '#12151c');
  bg.addColorStop(1, '#1d2430');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, view.w, view.h);

  const L = chain.linkLen;
  const w = L * 1.35;

  for (let i = 0; i < chain.links.length; i++) {
    const p0 = i === 0 ? chain.anchor : chain.links[i - 1];
    const p1 = chain.links[i];
    const cx = (p0.x + p1.x) / 2;
    const cy = (p0.y + p1.y) / 2;
    const ang = Math.atan2(p1.y - p0.y, p1.x - p0.x);
    const front = i % 2 === 0;
    const h = front ? L * 0.62 : L * 0.2;
    const r = front ? L * 0.31 : L * 0.1;

    ctx.save();
    ctx.translate(cx + 2, cy + 3);
    ctx.rotate(ang);
    roundRectPath(ctx, -w / 2, -h / 2, w, h, r);
    if (front) {
      ctx.lineWidth = L * 0.16;
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ang);
    const grad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
    grad.addColorStop(0, '#e3e8ef');
    grad.addColorStop(1, '#6b7686');
    roundRectPath(ctx, -w / 2, -h / 2, w, h, r);
    if (front) {
      ctx.lineWidth = L * 0.16;
      ctx.strokeStyle = grad;
      ctx.stroke();
    } else {
      ctx.fillStyle = grad;
      ctx.fill();
    }
    ctx.restore();
  }

  ctx.save();
  ctx.translate(chain.anchor.x, chain.anchor.y);
  roundRectPath(ctx, -14, -5, 28, 10, 3);
  ctx.fillStyle = '#8a94a3';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#14181f';
  ctx.fill();
  ctx.restore();
}
