/* =========================================================
   MARCO DE REFERENCIA — Tabla + Circuitos (localStorage)
   Modal 100% interactuable:
   • NO se oscurece el fondo
   • NO se cierra al hacer click afuera ni con ESC
   • Los clics fuera se bloquean (no navegan ni activan nada)
   • Lista de circuitos con scroll y “Cerrar” siempre visible
   ========================================================= */

(() => {
  "use strict";

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
    circuito01: [], circuito02: [], circuito03: [], circuito04: [], circuito05: [],
    meses: [""],
    tipoVisita: [""],
    cicloEscolar: [""],
    asesoria: [
      ""
    ]
  });

  const readYearData = (year) => {
    try {
      const raw = localStorage.getItem(keyForYear(year));
      return raw ? JSON.parse(raw) : defaultData();
    } catch { return defaultData(); }
  };
  const writeYearData = (year, data) => {
    try { localStorage.setItem(keyForYear(year), JSON.stringify(data)); } catch {}
  };

  let YEAR  = AppYear.getYear();
  let state = readYearData(YEAR);

  // ===== Tabla principal (Mes / Tipo / Ciclo / Asesoría) =====
  const COLUMNS = [
    { key: "meses",        title: "Mes" },
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

  // Agregar desde thead
  function wireThForms(){
    document.querySelectorAll(".th-form[data-target]").forEach(form => {
      const key = form.dataset.target;
      const input = form.querySelector(".th-input");
      form.addEventListener("submit", (ev) => {
        ev.preventDefault();
        const val = (input?.value || "").trim();
        if (!val) return;
        state[key] = state[key] || [];
        const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
        if (!state[key].some(x => norm(x) === norm(val))) {
          state[key].push(val);
          state[key].sort((a,b)=>a.localeCompare(b,'es',{sensitivity:'base'}));
          writeYearData(YEAR, state);
          renderTable();
        }
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

  // --- BLOQUEO seguro de eventos externos (no cierra, no navega) ---
  let removeTraps = () => {};
  function addGlobalTraps(){
    const handler = (ev) => {
      if (!modal || modal.hidden) return;
      // Si el click NO es dentro de la tarjeta, bloquea todo
      if (card && !card.contains(ev.target)) {
        ev.preventDefault();
        ev.stopPropagation();
        ev.stopImmediatePropagation();
      }
    };
    const types = ["click","mousedown","mouseup","pointerdown","pointerup","touchstart","touchend","contextmenu"];
    types.forEach(t => document.addEventListener(t, handler, true));
    // Ignora ESC
    const esc = (e) => { if (!modal || modal.hidden) return; if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); } };
    document.addEventListener("keydown", esc, true);

    removeTraps = () => {
      types.forEach(t => document.removeEventListener(t, handler, true));
      document.removeEventListener("keydown", esc, true);
      removeTraps = () => {};
    };
  }

  // --- Layout para que la lista scrollee y Cerrar siempre esté visible ---
  function applyModalLayout(){
    if (!card || !cardBody || !tableWrap) return;

    // Sin oscurecido y sin interceptar clics (los bloquea el trap)
    if (modal)   { modal.style.background = "transparent"; }
    if (backdrop){
      backdrop.style.background    = "transparent";
      backdrop.style.pointerEvents = "none";
    }

    // Contenedor principal
    card.style.maxHeight     = "90vh";
    card.style.width         = "min(920px, 96vw)";
    card.style.display       = "flex";
    card.style.flexDirection = "column";
    card.style.position      = "relative";
    card.style.zIndex        = "10002";

    // Cuerpo flexible
    cardBody.style.display       = "flex";
    cardBody.style.flexDirection = "column";
    cardBody.style.flex          = "1 1 auto";
    cardBody.style.minHeight     = "0";

    // Área scrollable
    tableWrap.style.flex      = "1 1 auto";
    tableWrap.style.minHeight = "0";
    tableWrap.style.overflowY = "auto";
    tableWrap.style.webkitOverflowScrolling = "touch";
  }

  function openModal(){
    if (!modal) return;
    modal.hidden = false;
    document.body.classList.add('modal-open');
    renderCircuitTable();
    applyModalLayout();
    addGlobalTraps();
    setTimeout(()=> inputAdd?.focus(), 0);
  }
  function closeModal(){
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove('modal-open');
    removeTraps();
  }

  openBtn?.addEventListener("click", openModal);
  closeBtns.forEach(btn => btn.addEventListener("click", closeModal));

  // Tabs de circuitos
  document.querySelectorAll(".circuit-tabs .tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".circuit-tabs .tab.is-active").forEach(b=>b.classList.remove("is-active"));
      btn.classList.add("is-active");
      currentCircuit = btn.dataset.circuit;
      renderCircuitTable();
      applyModalLayout();
      inputAdd?.focus();
    });
  });

  // Render de la tabla de un circuito
  function renderCircuitTable(){
    if (!tbody) return;
    const arr = state[currentCircuit] || [];
    let html = "";
    for (let i=0; i<arr.length; i++){
      const val = arr[i];
      html += `
        <tr>
          <td>${escapeHtml(val)}</td>
          <td><button class="btn-del" data-i="${i}">Eliminar</button></td>
        </tr>`;
    }
    if (arr.length === 0){
      html = `<tr><td colspan="2" style="opacity:.8">Sin registros en ${currentCircuit}.</td></tr>`;
    }
    tbody.innerHTML = html;
  }

  // Eliminar fila en circuitos
  tbody?.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-del");
    if (!btn) return;
    const i = parseInt(btn.dataset.i, 10);
    if (!Number.isFinite(i)) return;
    (state[currentCircuit] = state[currentCircuit] || []).splice(i, 1);
    writeYearData(YEAR, state);
    renderCircuitTable();
  });

  // Agregar fila en circuitos
  formAdd?.addEventListener("submit", (e) => {
    e.preventDefault();
    const val = (inputAdd?.value || "").trim();
    if (!val) return;
    const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
    state[currentCircuit] = state[currentCircuit] || [];
    if (!state[currentCircuit].some(x => norm(x) === norm(val))) {
      state[currentCircuit].push(val);
      state[currentCircuit].sort((a,b)=>a.localeCompare(b,'es',{sensitivity:'base'}));
      writeYearData(YEAR, state);
      renderCircuitTable();
    }
    inputAdd.value = ""; inputAdd.focus();
  });

  // Utilidad
  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  }

  // Arranque
  function start(){
    wireThForms();
    renderTable();
  }
  window.addEventListener("yearchange", () => {
    YEAR = AppYear.getYear();
    state = readYearData(YEAR);
    renderTable();
    renderCircuitTable();
    applyModalLayout();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else { start(); }

})();
