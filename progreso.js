(function () {
  const STORAGE_DIRECCION = "tablaPoa_direccion_v1"; // [{id, cols[4]}]
  const KEY_STORE = "progreso_store";
  const filterDireccion = document.getElementById('filterDireccion');
  const filterObjetivo  = document.getElementById('filterObjetivo');
  const tablaBody       = document.getElementById('tablaAvance').getElementsByTagName('tbody')[0];
  const objTituloNode   = document.getElementById('objTitulo');
  const int = (x) => { const n = parseInt(String(x).trim(), 10); return isNaN(n) ? 0 : n; };
  const clampPct = (v) => Math.max(0, Math.min(100, v));
  const readJSON = (k, fb) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : fb; } catch { return fb; } };
  function leerDirecciones() {
    try { const raw = localStorage.getItem(STORAGE_DIRECCION);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  }
  function leerPRAP(dirId) {
    try { const raw = localStorage.getItem(`prap_${dirId}`);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  }
  function getStore() { const s = readJSON(KEY_STORE, {}); return (s && typeof s==="object") ? s : {}; }
  function poblarDirecciones() {
    const dirs = leerDirecciones();
    filterDireccion.innerHTML = `<option value="">Elegir…</option>`;
    dirs.forEach((d, i) => {
      const opt = document.createElement('option');
      opt.value = d.id;
      const area = (d.cols && d.cols[0]) ? String(d.cols[0]) : '';
      opt.textContent = `#${i+1} — ${area.slice(0,80)}`;
      filterDireccion.appendChild(opt);
    });
  }
  function poblarObjetivos(dirId) {
    const prap = dirId ? leerPRAP(dirId) : [];
    filterObjetivo.innerHTML = `<option value="">Elegir…</option>`;
    if (!dirId || prap.length === 0) {
      filterObjetivo.disabled = true;
      return;
    }
    prap.forEach((row, idx) => {
      const opt = document.createElement('option');
      opt.value = String(idx);
      const titulo = (row.obj || '(sin objetivo)').toString();
      opt.textContent = `${idx+1}. ${titulo.slice(0, 110)}`;
      filterObjetivo.appendChild(opt);
    });
    filterObjetivo.disabled = false;
  }
  function limpiarTablaConMensaje(msg) {
    while (tablaBody.firstChild) tablaBody.removeChild(tablaBody.firstChild);
    const tr = tablaBody.insertRow();
    const td = tr.insertCell(0);
    td.colSpan = 8;
    td.className = 'placeholder';
    td.textContent = msg;
  }
  function renderFila(objetivo, iAbs, iiAbs) {
    while (tablaBody.firstChild) tablaBody.removeChild(tablaBody.firstChild);
    const total = iAbs + iiAbs;
    const restante = Math.max(0, objetivo - total);
    const pct = objetivo > 0 ? clampPct((total / objetivo) * 100) : 0;
    const iPct  = objetivo > 0 ? clampPct((iAbs  / objetivo) * 100) : 0;
    const iiPct = objetivo > 0 ? clampPct((iiAbs / objetivo) * 100) : 0;
    const tr = tablaBody.insertRow();
    const c = (v) => { const td = tr.insertCell(tr.cells.length); td.textContent = v; return td; };
    c(String(objetivo));
    c(String(total));
    c(String(restante));
    c(`${pct.toFixed(0)}%`);
    c(String(iAbs));
    c(`${iPct.toFixed(0)}%`);
    c(String(iiAbs));
    c(`${iiPct.toFixed(0)}%`);
  }
  function renderAvance(dirId, rowIdx) {
    if (!dirId || rowIdx === '' || rowIdx == null) {
      limpiarTablaConMensaje('Selecciona Dirección y Objetivo para ver el progreso.');
      objTituloNode.textContent = '(sin seleccionar)';
      return;
    }
    const prap = leerPRAP(dirId);
    const row  = prap[rowIdx];
    if (!row) {
      limpiarTablaConMensaje('No se encontró este objetivo PRAP.');
      objTituloNode.textContent = '(sin seleccionar)';
      return;
    }
    const objetivo = Math.max(0, int(row.cant));
    objTituloNode.textContent = (row.obj || '(sin objetivo)').toString();
    const store = getStore();
    const byPrap = store[dirId] || {};
    const st = byPrap[row.rid] || { iAbs:0, iiAbs:0 };
    const iAbs  = Math.max(0, int(st.iAbs));
    const iiAbs = Math.max(0, int(st.iiAbs));
    renderFila(objetivo, iAbs, iiAbs);
  }
  filterDireccion.addEventListener('change', () => {
    const dirId = filterDireccion.value;
    filterObjetivo.value = '';
    poblarObjetivos(dirId);
    renderAvance(null, null);
  });
  filterObjetivo.addEventListener('change', () => {
    const dirId = filterDireccion.value;
    const rowIdx = filterObjetivo.value;
    if (!dirId || rowIdx === '') {
      renderAvance(null, null);
      return;
    }
    renderAvance(dirId, parseInt(rowIdx, 10));
  });
  window.addEventListener('storage', (e) => {
    const dirId = filterDireccion.value;
    const rowIdx = filterObjetivo.value;
    if (e.key === STORAGE_DIRECCION) {
      poblarDirecciones();
      if (dirId) filterDireccion.value = dirId;
      poblarObjetivos(dirId);
    }
    if (dirId && e.key === `prap_${dirId}`) {
      poblarObjetivos(dirId);
      if (rowIdx !== '') renderAvance(dirId, parseInt(rowIdx, 10));
    }
    if (e.key === KEY_STORE || e.key === "__progreso_store_ping__") {
      if (dirId && rowIdx !== '') renderAvance(dirId, parseInt(rowIdx, 10));
    }
  });
  poblarDirecciones();
  renderAvance(null, null);
})();