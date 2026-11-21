export function orientationToGravity(betaDeg, gammaDeg, screenAngleDeg) {
  if (!Number.isFinite(betaDeg) || !Number.isFinite(gammaDeg)) {
    return { x: 0, y: 1 };
  }
  const b = (betaDeg * Math.PI) / 180;
  const g = (gammaDeg * Math.PI) / 180;
  const a = (Number.isFinite(screenAngleDeg) ? screenAngleDeg : 0) * Math.PI / 180;
  const dx = Math.cos(b) * Math.sin(g);
  const dy = Math.sin(b);
  const x = dx * Math.cos(a) + dy * Math.sin(a);
  const y = -dx * Math.sin(a) + dy * Math.cos(a);
  return { x, y };
}
