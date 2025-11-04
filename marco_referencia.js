/* =========================================================
   MARCO DE REFERENCIA — Tabla + Circuitos (localStorage)
   Modal 100% interactuable, sin oscurecer ni cerrar al hacer click fuera
   + MIGRACIÓN a claves canónicas de circuito (circuito01..05)
   + Se elimina el UI de "Mes", pero se conservan 12 meses internos
   ========================================================= */

(() => {
  "use strict";

  // ===== Utilidades comunes =====
  const readJSON  = (k, fb=null) => { try { return JSON.parse(localStorage.getItem(k)||'null') ?? fb; } catch { return fb; } };
  const writeJSON = (k, v)      => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const uniqSorted = (arr) => Array.from(new Set((arr||[]).map(v=>String(v).trim()))).filter(Boolean)
                                   .sort((a,b)=>a.localeCompare(b,'es',{numeric:true,sensitivity:'base'}));
  const normText = (s) => String(s||"")
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ')
    .trim();

  const DEFAULT_MESES = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
  ];

  // “Circuito 1”, “c3”, “03” -> "circuito01"
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

  // ===== Año (usa el existente si está definido) =====
  const AppYear = window.AppYear || (() => {
    const KEY="app_year_v1", DEF=2025;
    return {
      getYear: () => parseInt(localStorage.getItem(KEY)||DEF,10)||DEF,
      setYear: (y) => (localStorage.setItem(KEY,String(y)), y),
      MIN_YEAR: 2025, MAX_YEAR: 2028
    };
  })();

  // ===== Persistencia por año =====
  const LS_KEY_PREFIX = "marco_referencia_catalogos_v1";
  const keyForYear = (y) => `${LS_KEY_PREFIX}_${y}`;

  const defaultData = () => ({
    // Meses internos (no se editan en esta vista)
    meses: [...DEFAULT_MESES],
    // Catálogos editables
    tipoVisita: [], cicloEscolar: [], asesoria: [],
    // Circuitos
    circuito01: [], circuito02: [], circuito03: [], circuito04: [], circuito05: []
  });

  // Normaliza y MIGRA cualquier forma vieja a {circuito01..05}
  function normalizeStateKeys(objRaw){
    const base = defaultData();

    // Copia sanas para catálogos (si existen en el almacen viejo)
    const copyArr = (key, ...aliases) => {
      const src = [key, ...aliases].map(k => objRaw?.[k]).find(v => Array.isArray(v));
      if (src && src.length) base[key] = uniqSorted(src);
    };
    // Meses: si el viejo tiene meses, respétalos; si no, deja los 12 por defecto
    copyArr('meses', 'Meses', 'mes');
    if (!base.meses.length) base.meses = [...DEFAULT_MESES];

    copyArr('tipoVisita', 'Tipo de visita', 'tipo', 'Tipo');
    copyArr('cicloEscolar', 'Ciclo escolar', 'ciclo', 'Ciclo');
    copyArr('asesoria', 'Asesoría', 'Asesoria', 'asesorias');

    // Recolecta posibles listas de instituciones de claves variadas
    const pushMany = (kCanon, list) => {
      base[kCanon].push(...uniqSorted(list||[]));
      base[kCanon] = uniqSorted(base[kCanon]);
    };

    const takeInstitutions = (val) => {
      if (!val) return [];
      if (Array.isArray(val)) return uniqSorted(val.map(String));
      if (typeof val==='object'){
        const bags = [];
        for (const cand of ['instituciones','centros','escuelas','colegios','lista','items']) {
          if (Array.isArray(val[cand])) bags.push(...val[cand]);
        }
        if (val.nombre) bags.push(String(val.nombre));
        return uniqSorted(bags);
      }
      return [String(val)];
    };

    // 1) Si ya existen las canónicas, se integran tal cual
    for (let i=1;i<=5;i++){
      const k = `circuito${String(i).padStart(2,'0')}`;
      if (Array.isArray(objRaw?.[k])) pushMany(k, objRaw[k]);
    }
    // 2) Explora TODAS las claves del objeto y migra variantes
    Object.keys(objRaw || {}).forEach(k => {
      if (['meses','Meses','mes','tipoVisita','Tipo de visita','tipo','Tipo','cicloEscolar','Ciclo escolar','ciclo','Ciclo','asesoria','Asesoría','Asesoria','asesorias'].includes(k)) return;
      const canon = canonCircuitKey(k);
      if (canon) pushMany(canon, takeInstitutions(objRaw[k]));
    });

    return base;
  }

  const readYearData = (year) => {
    const raw = readJSON(keyForYear(year), null);
    if (!raw) return defaultData();
    const norm = normalizeStateKeys(raw);
    // Si cambió, MIGRA
    if (JSON.stringify(norm) !== JSON.stringify(raw)) writeYearData(year, norm);
    return norm;
  };
  const writeYearData = (year, data) => writeJSON(keyForYear(year), data);

  let YEAR  = AppYear.getYear();
  let state = readYearData(YEAR);

  // ===== Tabla principal (UI) — *Sin* columna Mes =====
  const COLUMNS = [
    { key: "tipoVisita",   title: "Tipo de visita" },
    { key: "cicloEscolar", title: "Ciclo escolar" },
    { key: "asesoria",     title: "Asesoría" }
  ];

  function renderTable(){
    const body = document.getElementById("tblBody");
    if (!body) return;
    const arrays = COLUMNS.map(c => state[c.key] || []);
    const maxRows = Math.max(0, ...arrays.map(a => a.length));
    let html = "";
    for (let i=0; i<maxRows; i++){
      html += "<tr>";
      for (let col=0; col<COLUMNS.length; col++){
        const arr = arrays[col];
        const val = arr[i] ?? "";
        if (val){
          html += `<td><div class="cell"><span class="txt" title="${val}">${val}</span>
                     <button class="del" type="button" data-col="${COLUMNS[col].key}" data-index="${i}">Eliminar</button>
                   </div></td>`;
        } else {
          html += `<td></td>`;
        }
      }
      html += "</tr>";
    }
    body.innerHTML = html;
  }

  // Eliminar desde la tabla
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".del");
    if (!btn) return;
    const col = btn.dataset.col;
    const idx = parseInt(btn.dataset.index, 10);
    if (!col || !Number.isFinite(idx)) return;
    (state[col] = state[col] || []).splice(idx, 1);
    writeYearData(YEAR, state);
    renderTable();
  });

  // Agregar desde thead (ya no existe “meses” aquí)
  function wireThForms(){
    document.querySelectorAll(".th-form[data-target]").forEach(form => {
      const key = form.dataset.target;
      const input = form.querySelector(".th-input");
      form.addEventListener("submit", (ev) => {
        ev.preventDefault();
        const val = (input?.value || "").trim();
        if (!val) return;
        state[key] = uniqSorted([...(state[key]||[]), val]);
        writeYearData(YEAR, state);
        renderTable();
        input.value = ""; input.focus();
      });
    });
  }

  // ===== Modal Circuitos =====
  const modal     = document.getElementById("circuitosModal");
  const backdrop  = modal?.querySelector(".modal__backdrop");
  const card      = document.getElementById("circuitosCard");
  const cardBody  = card ? card.querySelector(".card-body") : null;
  const tbody     = document.getElementById("circuitTbody");
  const inputAdd  = document.getElementById("circuitInput");
  const formAdd   = document.querySelector(".circuit-add");
  const openBtn   = document.getElementById("btnCircuitos");
  const closeBtns = modal ? modal.querySelectorAll("[data-close]") : [];
  const tableWrap = modal ? modal.querySelector(".table-circuito-wrap") : null;
  let currentCircuit = "circuito01";

  // Trampas para bloquear exterior
  let removeTraps = () => {};
  function addGlobalTraps(){
    const handler = (ev) => {
      if (!modal || modal.hidden) return;
      if (card && !card.contains(ev.target)) {
        ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
      }
    };
    const types = ["click","mousedown","mouseup","pointerdown","pointerup","touchstart","touchend","contextmenu"];
    types.forEach(t => document.addEventListener(t, handler, true));
    const esc = (e) => { if (!modal || modal.hidden) return; if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); } };
    document.addEventListener("keydown", esc, true);
    removeTraps = () => {
      types.forEach(t => document.removeEventListener(t, handler, true));
      document.removeEventListener("keydown", esc, true);
      removeTraps = () => {};
    };
  }

  function applyModalLayout(){
    if (!card || !cardBody || !tableWrap) return;
    if (modal)   { modal.style.background = "transparent"; }
    if (backdrop){ backdrop.style.background = "transparent"; backdrop.style.pointerEvents = "none"; }
    card.style.maxHeight="90vh"; card.style.width="min(920px,96vw)";
    card.style.display="flex"; card.style.flexDirection="column"; card.style.position="relative";
    cardBody.style.display="flex"; cardBody.style.flexDirection="column"; cardBody.style.flex="1 1 auto"; cardBody.style.minHeight="0";
    tableWrap.style.flex="1 1 auto"; tableWrap.style.minHeight="0"; tableWrap.style.overflowY="auto"; tableWrap.style.webkitOverflowScrolling="touch";
  }

  function openModal(){ if (!modal) return; modal.hidden=false; document.body.classList.add('modal-open'); renderCircuitTable(); applyModalLayout(); addGlobalTraps(); setTimeout(()=> inputAdd?.focus(),0); }
  function closeModal(){ if (!modal) return; modal.hidden=true; document.body.classList.remove('modal-open'); removeTraps(); }

  openBtn?.addEventListener("click", openModal);
  closeBtns.forEach(btn => btn.addEventListener("click", closeModal));

  document.querySelectorAll(".circuit-tabs .tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".circuit-tabs .tab.is-active").forEach(b=>b.classList.remove("is-active"));
      btn.classList.add("is-active");
      currentCircuit = btn.dataset.circuit;
      renderCircuitTable(); applyModalLayout(); inputAdd?.focus();
    });
  });

  function renderCircuitTable(){
    if (!tbody) return;
    const arr = uniqSorted(state[currentCircuit] || []);
    let html = "";
    for (let i=0; i<arr.length; i++){
      const val = arr[i];
      html += `<tr><td>${escapeHtml(val)}</td><td><button class="btn-del" data-i="${i}">Eliminar</button></td></tr>`;
    }
    if (arr.length === 0){ html = `<tr><td colspan="2" style="opacity:.8">Sin registros en ${currentCircuit}.</td></tr>`; }
    tbody.innerHTML = html;
  }

  tbody?.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-del");
    if (!btn) return;
    const i = parseInt(btn.dataset.i, 10);
    if (!Number.isFinite(i)) return;
    (state[currentCircuit] = state[currentCircuit] || []).splice(i, 1);
    writeYearData(YEAR, state);
    renderCircuitTable();
  });

  formAdd?.addEventListener("submit", (e) => {
    e.preventDefault();
    const val = (inputAdd?.value || "").trim();
    if (!val) return;
    state[currentCircuit] = uniqSorted([...(state[currentCircuit]||[]), val]);
    writeYearData(YEAR, state);
    renderCircuitTable();
    inputAdd.value = ""; inputAdd.focus();
  });

  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }

  // Arranque
  function start(){ wireThForms(); renderTable(); }
  window.addEventListener("yearchange", () => {
    const y = AppYear.getYear();
    if (y !== YEAR){ state = readYearData(y); YEAR = y; }
    renderTable(); renderCircuitTable(); applyModalLayout();
  });

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', start); }
  else { start(); }
})();
