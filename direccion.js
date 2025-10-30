(function () {
  const YEAR_KEY = "app_year_v1";
  const NOW = new Date().getFullYear();
  const getYear = () => {
    const y = parseInt(localStorage.getItem(YEAR_KEY) || "", 10);
    return Number.isFinite(y) ? y : NOW;
  };
  const ykey  = (k)    => `${getYear()}_${k}`;
  const yGet  = (k)    => localStorage.getItem(ykey(k));
  const ySet  = (k, v) => localStorage.setItem(ykey(k), v);
  const yDel  = (k)    => localStorage.removeItem(ykey(k));
  const STORAGE_KEY = "tablaPoa_direccion_v1"; 
  const DETAIL_PAGE = "prap.html";
  const COLS = 4;
  const tabla = document.getElementById("tablaPoa").getElementsByTagName("tbody")[0];
  const botonAgregar = document.getElementById("agregarFila");
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const sanitizeCols = (cols = []) => {
    const a = (Array.isArray(cols) ? cols : []).slice(0, COLS);
    while (a.length < COLS) a.push("");
    return a;
  };
  function leerDirecciones() {
    try {
      const raw = yGet(STORAGE_KEY);
      const arr = raw ? JSON.parse(raw) : null;
      if (!Array.isArray(arr)) return null;
      return arr.map(d => ({ id: d.id || uid(), cols: sanitizeCols(d.cols) }));
    } catch { return null; }
  }
  function escribirDirecciones(arr) {
    try {
      ySet(STORAGE_KEY, JSON.stringify(arr));
    } catch (e) {
      console.warn("No se pudo guardar en localStorage:", e);
    }
  }
  function crearCeldaNumeroEnlace(tr, idx, id) {
    const td = tr.insertCell(0);
    const year = getYear();
    // Pasamos el año en la URL por si la página prap.html quiere leerlo explícitamente
    td.innerHTML = `<a href="${DETAIL_PAGE}?id=${encodeURIComponent(id)}&year=${year}" title="Abrir PRAP relacionado">${idx + 1}</a>`;
    td.style.textAlign = "center";
  }
  function crearCeldasEditablesDireccion(tr, valores = ["", "", "", ""]) {
    for (let i = 0; i < COLS; i++) {
      const td = tr.insertCell(i + 1); // +1 por la col N°
      td.contentEditable = "true";
      td.textContent = valores[i] ?? "";
    }
  }
  function crearCeldaAccion(tr, onRemove) {
    const td = tr.insertCell(tr.cells.length);
    const btn = document.createElement("button");
    btn.textContent = "🗑️";
    btn.className = "eliminar-fila";
    btn.addEventListener("click", onRemove);
    td.appendChild(btn);
  }
  function renderTabla(direcciones) {
    while (tabla.firstChild) tabla.removeChild(tabla.firstChild);
    (direcciones || []).forEach((fila, idx) => {
      const tr = tabla.insertRow();
      crearCeldaNumeroEnlace(tr, idx, fila.id);
      crearCeldasEditablesDireccion(tr, sanitizeCols(fila.cols));
      crearCeldaAccion(tr, () => {
        const nuevo = direcciones.filter(d => d.id !== fila.id);
        escribirDirecciones(nuevo);
        // Limpia el PRAP asociado de ESTE AÑO
        try { yDel(`prap_${fila.id}`); } catch {}
        renderTabla(nuevo);
      });
    });
  }
  function serializarDesdeDOM() {
    const direcciones = [];
    [...tabla.rows].forEach((tr) => {
      const a = tr.cells[0]?.querySelector?.("a");
      const id = a
        ? new URL(a.getAttribute("href"), location.href).searchParams.get("id")
        : uid();
      const startIndex = a ? 1 : 0;
      const cols = [];
      for (let i = 0; i < COLS; i++) {
        cols.push(tr.cells[startIndex + i]?.textContent ?? "");
      }
      direcciones.push({ id, cols: sanitizeCols(cols) });
    });
    return direcciones;
  }
  let tSave;
  function guardarDesdeDOM() {
    clearTimeout(tSave);
    tSave = setTimeout(() => {
      const arr = serializarDesdeDOM();
      escribirDirecciones(arr);
    }, 120);
  }
  let direcciones = leerDirecciones();
  if (!direcciones) {
    direcciones = serializarDesdeDOM().map(d => ({ id: uid(), cols: sanitizeCols(d.cols) }));
    escribirDirecciones(direcciones);
  }
  renderTabla(direcciones);
  tabla.addEventListener("input", (e) => {
    if (e.target && e.target.matches('td[contenteditable="true"]')) {
      guardarDesdeDOM();
    }
  });
  tabla.addEventListener("click", (e) => {
    const btn = e.target.closest(".eliminar-fila");
    if (!btn) return;
    const tr = btn.closest("tr");
    tr?.remove();
    guardarDesdeDOM();
    const arr = leerDirecciones() || [];
    renderTabla(arr);
  });
  botonAgregar.addEventListener("click", () => {
    const arr = leerDirecciones() || [];
    const nuevo = { id: uid(), cols: sanitizeCols([]) };
    arr.push(nuevo);
    escribirDirecciones(arr);
    renderTabla(arr);
  });
  window.addEventListener("storage", (e) => {
    if (!e.key) return;
    const yr = `${getYear()}_`;
    if (!e.key.startsWith(yr)) return;
    const tail = e.key.slice(yr.length);
    if (tail === STORAGE_KEY || tail.startsWith("prap_")) {
      const arr = leerDirecciones() || [];
      renderTabla(arr);
    }
  });
})();
(function () {
  const btn = document.getElementById("btnFiltrarDireccion");
  if (!btn) return;
  if (!btn.getAttribute("aria-label")) {
    btn.setAttribute("aria-label", "Filtrar PRAP por Dirección y Responsable");
  }
  btn.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      btn.click();
    }
  });
})();
(function oneWayNav() {
  function isInternalHtmlLink(a) {
    if (!a || !a.href) return false;
    const url = new URL(a.href, location.href);
    return url.origin === location.origin && /\.html($|[?#])/i.test(url.pathname);
  }
  document.addEventListener(
    "click",
    (ev) => {
      const a = ev.target.closest("a");
      if (!a) return;
      if (!isInternalHtmlLink(a)) return;
      if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || a.target === "_blank") return;
      ev.preventDefault();
      location.replace(a.href);
    },
    true
  );
  window.addEventListener("pageshow", function (e) {
    if (e.persisted) {
      setTimeout(() => {
        history.back();
      }, 0);
    }
  });
})();