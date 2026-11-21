const TEXT = {
  'unsupported': 'Sin API de sensores (usa ratón o sliders)',
  'needs-permission': 'Sensores: permiso pendiente',
  'requesting': 'Sensores: solicitando permiso…',
  'denied': 'Sensores: permiso denegado',
  'listening': 'Sensores: esperando datos…',
  'active': 'Sensores: activos',
  'no-sensor': 'Sin datos de sensor (usa ratón o sliders)'
};

export function initHud({ sensors, fallback, els }) {
  let lastSource = 'manual';
  let statusText = null;
  let statusKey = null;
  let readoutText = null;
  let hintText = null;
  let btnHidden = null;
  let btnText = null;

  function update(source) {
    lastSource = source;
    const s = sensors.state.status;

    const text = TEXT[s] || s;
    if (text !== statusText) {
      els.status.textContent = text;
      statusText = text;
    }
    if (s !== statusKey) {
      els.status.dataset.status = s;
      statusKey = s;
    }

    const hidden = (s === 'active' || s === 'unsupported');
    if (hidden !== btnHidden) {
      els.btn.hidden = hidden;
      btnHidden = hidden;
    }
    const btnLabel = s === 'denied' ? 'Reintentar permiso' : 'Activar sensores';
    if (btnLabel !== btnText) {
      els.btn.textContent = btnLabel;
      btnText = btnLabel;
    }

    const src = source === 'sensor' ? sensors.state : fallback.state;
    const fmt = n => (typeof n === 'number' ? n.toFixed(0) : '–');
    const readout = `β ${fmt(src.beta)}°  γ ${fmt(src.gamma)}°  · ${source === 'sensor' ? 'giroscopio' : 'manual'}`;
    if (readout !== readoutText) {
      els.readout.textContent = readout;
      readoutText = readout;
    }

    const hint = !window.isSecureContext
      ? 'iOS exige HTTPS para los sensores'
      : (s === 'denied' ? 'Ajustes > Safari > Movimiento y orientación (o reinicia Safari) y pulsa Reintentar' : '');
    if (hint !== hintText) {
      els.hint.textContent = hint;
      hintText = hint;
    }
  }

  els.btn.addEventListener('click', () => {
    sensors.requestPermission().then(() => update(lastSource));
  });

  return { update };
}
