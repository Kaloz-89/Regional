(() => {
  "use strict";

  /* =========================================================
     JEFATURA — PÚBLICO (solo lectura)
     - Lee localStorage.visitas_jefatura_v1 por AÑO
     - Misma normalización de circuito (“Circuito 03”)
     - Se actualiza en vivo si otra pestaña guarda cambios
  ========================================================= */

  // ---------- Helpers ----------
  const $  = (sel, ctx=document) => ctx.querySelector(sel);
  const readJSON = (k, fb=null) => { try { return JSON.parse(localStorage.getItem(k)||'null') ?? fb; } catch { return fb; } };

  const normText = (s) => String(s||"")
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ')
    .trim();

  // Convierte “Circuito 1”, “c3”, “03” → "circuito01".."circuito99"
  function canonCircuitKey(input){
    const raw = String(input||"").trim();
    if (!raw) return "";
    const nrm = normText(raw);
    const m = nrm.match(/\d+/);
    if (m) {
      const num = Math.max(1, Math.min(99, parseInt(m[0],10)));
      return `circuito${String(num).padStart(2,'0')}`;
    }
    if (nrm.includes('circuit')) return 'circuito01';
    return "";
  }
  const displayCircuit = (raw) => {
    const key = canonCircuitKey(raw);
    if (!key) return "";
    const n = key.replace('circuito','');
    return `Circuito ${n}`;
  };

  // Año activo (usa AppYear si existe, si no, cae a LS o 2025)
  const AppYearShim = (() => {
    const FB = 2025;
    const fromLS = parseInt(localStorage.getItem("app_year_v1")||"", 10);
    const val = (window.AppYear && typeof window.AppYear.getYear==="function")
      ? window.AppYear.getYear()
      : (Number.isFinite(fromLS) ? fromLS : FB);
    return { get: () => val };
  })();
  const YEAR = String(AppYearShim.get());

  // ---------- IO por año ----------
  const STORE_KEY = "visitas_jefatura_v1";

  function normalizeRow(src){
    const r = src || {};
    return {
      asesoria:          v(r.asesoria),
      circuito:          v(r.circuito),
      institucion:       v(r.institucion),
      mes:               v(r.mes),
      fecha:             v(r.fecha),
      tipoVisita:        v(r.tipoVisita),
      cicloEscolar:      v(r.cicloEscolar),
      tematica:          v(r.tematica),
      prioridad:         v(r.prioridad),
      observacion:       v(r.observacion),
      validacionJefatura:v(r.validacionJefatura) || "Pendiente",
      estado:            v(r.estado) || "Sin revisar",
      id:                r.id || ""
    };
  }
  const v = (x) => (x==null ? "" : String(x));

  function readRowsByYear(year){
    const all = readJSON(STORE_KEY, {});
    const arr = (all && Array.isArray(all[year])) ? all[year]
              : (all && all[year] && Array.isArray(all[year].rows)) ? all[year].rows
              : [];
    return (arr||[]).map(normalizeRow);
  }

  // ---------- Render ----------
  const tbody = $('#jefPubTbody');

  function tdText(txt){
    const td = document.createElement('td');
    // Mantén saltos en textos largos (observación/temática)
    const div = document.createElement('div');
    div.textContent = (txt || "").trim() || "—";
    div.style.whiteSpace = 'pre-wrap';
    div.style.wordBreak = 'break-word';
    td.appendChild(div);
    return td;
  }

  function render(rows){
    if (!tbody) return;
    tbody.innerHTML = "";
    if (!rows || rows.length===0){
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 12;
      td.style.textAlign = 'center';
      td.textContent = 'Sin registros para el año seleccionado.';
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    for (const row of rows){
      const tr = document.createElement('tr');

      tr.appendChild(tdText(row.asesoria));
      tr.appendChild(tdText(displayCircuit(row.circuito)));
      tr.appendChild(tdText(row.institucion));
      tr.appendChild(tdText(row.mes));
      tr.appendChild(tdText(row.fecha));             // ISO (yyyy-mm-dd) guardado por el form
      tr.appendChild(tdText(row.tipoVisita));
      tr.appendChild(tdText(row.cicloEscolar));
      tr.appendChild(tdText(row.tematica));
      tr.appendChild(tdText(row.prioridad));
      tr.appendChild(tdText(row.observacion));
      tr.appendChild(tdText(row.validacionJefatura));
      tr.appendChild(tdText(row.estado));

      tbody.appendChild(tr);
    }
  }

  // ---------- Carga + reactividad ----------
  function refresh(){ render(readRowsByYear(YEAR)); }

  function bind(){
    // Si Formulario/Jefatura escriben en otra pestaña, nos actualizamos
    window.addEventListener('storage', (ev) => {
      if (ev.key === 'visitas_jefatura_last_update' || ev.key === STORE_KEY) {
        refresh();
      }
    });

    // Cambio de año vía selector global
    window.addEventListener('yearchange', (ev)=>{
      // normalmente recargas la página; si no, puedes sólo refrescar
      location.reload();
    });
  }

  function start(){ refresh(); bind(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
