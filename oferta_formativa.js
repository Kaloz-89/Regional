// Oferta Formativa (contenteditable) — Edit & View (por AÑO)
(() => {
  "use strict";

  // ---------- Año activo ----------
  const YEAR_KEY = "app_year_v1";
  const NOW_YEAR = new Date().getFullYear();

  function getActiveYear() {
    try {
      const p = new URLSearchParams(location.search);
      const fromUrl = parseInt(p.get("year") || "", 10);
      if (Number.isFinite(fromUrl)) return fromUrl;
    } catch {}
    const fromLs = parseInt(localStorage.getItem(YEAR_KEY) || "", 10);
    if (Number.isFinite(fromLs)) return fromLs;
    return NOW_YEAR;
  }

  let YEAR = getActiveYear();

  // Claves por año
  const dataKey = (y) => `${y}_oferta_formativa_v1`;
  const lastKey = (y) => `${y}_oferta_formativa_last`;

  // Claves antiguas (sin año) para migración
  const LEGACY_DATA = "oferta_formativa_v1";
  const LEGACY_LAST = "oferta_formativa_last";

  // Campos de la tabla (orden = columnas)
  const FIELDS = [
    "trimestre","brecha","objetivo","nombre","clase","estrategia",
    "modalidad","horas","grupos","poblacion","fecha_ini","fecha_fin","instancia","actividad_realizada","cant_hombres","cant_mujeres"
  ];

  const el = (sel, ctx=document) => ctx.querySelector(sel);

  // ---------- IO ----------
  const read = () => {
    try {
      const raw = localStorage.getItem(dataKey(YEAR));
      const v = raw ? JSON.parse(raw) : [];
      return Array.isArray(v) ? v : [];
    } catch { return []; }
  };

  const write = (rows) => {
    try {
      localStorage.setItem(dataKey(YEAR), JSON.stringify(rows));
      localStorage.setItem(lastKey(YEAR), String(Date.now()));
    } catch {}
  };

  const rid = () =>
    "of_" + Math.random().toString(36).slice(2, 7) + "_" + Date.now().toString(36);

  const normalize = (r = {}) => {
    const o = { id: r.id || rid() };
    FIELDS.forEach((k) => (o[k] = (r[k] ?? "").toString()));
    return o;
  };

  // Migración desde las claves viejas (sin año) a la clave del año actual
  function migrateIfNeeded() {
    const hasYearData = !!localStorage.getItem(dataKey(YEAR));
    if (!hasYearData) {
      const legacy = localStorage.getItem(LEGACY_DATA);
      if (legacy) {
        // Copiamos a la clave del año actual (no borramos el legacy)
        localStorage.setItem(dataKey(YEAR), legacy);
      }
      const legacyLast = localStorage.getItem(LEGACY_LAST);
      if (legacyLast) {
        localStorage.setItem(lastKey(YEAR), legacyLast);
      }
    }
  }

  // ---------- EDIT ----------
  function renderEdit() {
    const tbody = el("#ofTbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const rows = read().map(normalize);
    rows.forEach((row) => {
      const tr = document.createElement("tr");
      tr.dataset.id = row.id;

      FIELDS.forEach((k) => {
        const td = tr.insertCell(-1);
        td.contentEditable = "true";
        td.textContent = row[k] || "";
        td.dataset.key = k;
        td.dataset.id = row.id;
      });

      const tdDel = tr.insertCell(-1);
      tdDel.className = "col-del";
      const btn = document.createElement("button");
      btn.className = "btn-trash";
      btn.title = "Eliminar fila";
      btn.textContent = "🗑️";
      btn.addEventListener("click", () => {
        const nuevo = read().filter((x) => x.id !== row.id);
        write(nuevo);
        renderEdit();
      });
      tdDel.style.textAlign = "center";
      tdDel.appendChild(btn);

      tbody.appendChild(tr);
    });

    // Guardado diferido desde el DOM
    let t;
    function saveFromDOM() {
      clearTimeout(t);
      t = setTimeout(() => {
        const nuevo = [];
        [...tbody.rows].forEach((tr) => {
          const cells = tr.cells;
          const o = { id: tr.dataset.id || rid() };
          FIELDS.forEach((k, idx) => (o[k] = (cells[idx]?.textContent || "").trim()));
          nuevo.push(normalize(o));
        });
        write(nuevo);
      }, 120);
    }

    tbody.addEventListener("input", (e) => {
      if (!e.target.closest('td[contenteditable="true"]')) return;
      saveFromDOM();
    });

    const add = el("#ofAdd");
    const prn = el("#ofPrint");
    if (add)
      add.onclick = () => {
        write([...read(), normalize({})]);
        renderEdit();
      };
    if (prn) prn.onclick = () => window.print();
  }

  // ---------- VIEW ----------
  function renderView() {
    const tbody = el("#ofTbodyView");
    if (!tbody) return;
    tbody.innerHTML = "";

    const rows = read().map(normalize);
    rows.forEach((r) => {
      const tr = document.createElement("tr");
      FIELDS.forEach((k) => {
        const td = tr.insertCell(-1);
        td.textContent = r[k] || "";
      });
      tbody.appendChild(tr);
    });

    const prn = el("#ofPrintView");
    if (prn) prn.onclick = () => window.print();
  }

  // ---------- Arranque / Reactividad ----------
  function renderAll() {
    // En cada (re)render recalculemos YEAR por si cambió por URL o LS
    YEAR = getActiveYear();
    migrateIfNeeded();
    if (el("#ofTbody")) renderEdit();
    if (el("#ofTbodyView")) renderView();
  }

  function start() {
    migrateIfNeeded();
    renderAll();
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", start);
  else start();

  // Reactividad entre pestañas y cambios de año
  window.addEventListener("storage", (e) => {
    if (!e.key) return;

    // Si cambiaron datos del año actual, re-render
    if (e.key === dataKey(YEAR) || e.key === lastKey(YEAR)) {
      renderAll();
      return;
    }

    // Si cambió el año global, recalcular y re-render
    if (e.key === YEAR_KEY) {
      const ny = parseInt(e.newValue || "", 10);
      if (Number.isFinite(ny) && ny !== YEAR) {
        YEAR = ny;
        renderAll();
      }
    }

    // Si llega una clave de otros años, la ignoramos.
  });

  // Soportar evento personalizado de tu app para cambio de año
  window.addEventListener("yearchange", () => {
    YEAR = getActiveYear();
    renderAll();
  });
})();
