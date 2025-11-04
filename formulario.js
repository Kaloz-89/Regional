(() => {
  "use strict";

  /* =========================================================
     FORMULARIO — Catálogos y Circuitos dependientes por AÑO
     Fuente única: marco_referencia_catalogos_v1_<AÑO>
     (migración/normalización incluida para evitar llaves raras)
     ========================================================= */

  // ---------- Helpers ----------
  const $  = (sel, ctx=document) => ctx.querySelector(sel);
  const readJSON  = (k, fb=null) => { try{ return JSON.parse(localStorage.getItem(k)||'null') ?? fb; }catch{ return fb; } };
  const writeJSON = (k, v)      => { try{ localStorage.setItem(k, JSON.stringify(v)); }catch{} };
  const uniqSorted = (arr=[]) => Array.from(new Set(arr.map(v=>String(v).trim())))
                                      .filter(Boolean)
                                      .sort((a,b)=>a.localeCompare(b,'es',{numeric:true,sensitivity:'base'}));

  const norm = (s) => String(s||"")
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ')
    .trim();

  function canonCircuitKey(input){
    const n = norm(input);
    const m = n.match(/\d+/);
    if (m) return `circuito${String(Math.max(1,Math.min(99,parseInt(m[0],10))).toString().padStart(2,'0'))}`;
    if (n.includes('circuit')) return 'circuito01';
    return '';
  }

  function selectedText(sel){
    const opt = sel?.options?.[sel.selectedIndex];
    return opt ? opt.text : '';
  }

  function validInstitution(x){
    const t = String(x||'').trim();
    if (t.length < 2) return false;           // descarta vacíos y 1 char
    if (/^[\p{N}]+$/u.test(t)) return false;  // sólo números (e.g. "98")
    if (!/[\p{L}]/u.test(t)) return false;    // sin letras
    return true;
  }

  // ---------- Año activo ----------
  const AppYearShim = (() => {
    const FALLBACK = 2025;
    const fromLS = parseInt(localStorage.getItem("app_year_v1")||"", 10);
    const val = (window.AppYear && typeof window.AppYear.getYear==="function")
      ? window.AppYear.getYear()
      : (Number.isFinite(fromLS) ? fromLS : FALLBACK);
    return { get: () => val };
  })();
  const getYear = () => String(AppYearShim.get());

  // ---------- Claves ----------
  const MR_PREFIX   = "marco_referencia_catalogos_v1";
  const MR_KEY      = (y) => `${MR_PREFIX}_${String(y)}`;
  const VISITS_SINK = "visitas_jefatura_v1";

  // ---------- Migración/normalización del MR (in-place) ----------
  function migrateMRObject(obj){
    if (!obj || typeof obj !== 'object') return { meses:[], tipoVisita:[], cicloEscolar:[], asesoria:[] };

    const out = { meses:[], tipoVisita:[], cicloEscolar:[], asesoria:[] };
    // Copia catálogos si existen (arrays)
    out.meses        = Array.isArray(obj.meses)        ? uniqSorted(obj.meses)        : [];
    out.tipoVisita   = Array.isArray(obj.tipoVisita)   ? uniqSorted(obj.tipoVisita)   : [];
    out.cicloEscolar = Array.isArray(obj.cicloEscolar) ? uniqSorted(obj.cicloEscolar) : [];
    out.asesoria     = Array.isArray(obj.asesoria)     ? uniqSorted(obj.asesoria)     : [];

    // Recolector genérico de instituciones
    const map = {};
    const pushMany = (keyLike, val) => {
      const cKey = canonCircuitKey(keyLike);
      if (!cKey) return;
      map[cKey] = map[cKey] || [];
      if (Array.isArray(val)) {
        for (const v of val) {
          if (v && typeof v !== 'object') map[cKey].push(String(v));
          else if (v && typeof v === 'object' && v.nombre) map[cKey].push(String(v.nombre));
        }
      } else if (val && typeof val === 'object') {
        const buckets = ['instituciones','centros','escuelas','colegios','lista','items'];
        for (const b of buckets) {
          if (Array.isArray(val[b])) val[b].forEach(x => map[cKey].push(String(x)));
        }
      } else if (val != null) {
        map[cKey].push(String(val));
      }
    };

    // Recorre todas las claves del objeto buscando “circuito*”
    for (const k of Object.keys(obj)) {
      if (!k) continue;
      if (norm(k).includes('circuit')) pushMany(k, obj[k]);
    }

    // Asegura 5 circuitos canónicos filtrando basura
    for (let i=1;i<=5;i++){
      const k = `circuito${String(i).padStart(2,'0')}`;
      const arr = (map[k] || []).filter(validInstitution);
      out[k] = uniqSorted(arr);
    }

    return out;
  }

  // Lee/sanea y, si cambió, lo escribe de vuelta para unificar formato
  function readMRYearClean(year){
    const key = MR_KEY(year);
    const raw = readJSON(key, null) || {};
    const cleaned = migrateMRObject(raw);

    // Si difiere del guardado, persiste saneado (evita que reaparezcan “98”, etc.)
    try {
      const before = JSON.stringify(raw);
      const after  = JSON.stringify(cleaned);
      if (before !== after) writeJSON(key, cleaned);
    } catch {}
    return cleaned;
  }

  // ---------- Carga por AÑO ----------
  function loadCatalogsByYear(year){
    const obj = readMRYearClean(year);
    return {
      meses:        obj.meses,
      tipoVisita:   obj.tipoVisita,
      cicloEscolar: obj.cicloEscolar,
      asesoria:     obj.asesoria,
    };
  }

  function loadCircuitsMapByYear(year){
    const obj = readMRYearClean(year);
    const map = {};
    for (let i=1;i<=5;i++){
      const k = `circuito${String(i).padStart(2,'0')}`;
      map[k] = Array.isArray(obj[k]) ? obj[k] : [];
    }
    return map;
  }

  // ---------- UI helpers ----------
  function fillSelect(sel, values, placeholder="Seleccionar…") {
    const el = typeof sel === "string" ? $(sel) : sel;
    if (!el) return;
    const prev = el.value;
    el.innerHTML = "";
    const o0 = document.createElement("option");
    o0.value = ""; o0.textContent = placeholder; o0.hidden = true; o0.selected = true;
    el.appendChild(o0);
    (values||[]).forEach(v=>{
      const opt = document.createElement("option");
      opt.value = v; opt.textContent = v;
      el.appendChild(opt);
    });
    if (prev && (values||[]).includes(prev)) el.value = prev;
  }

  function ensureCircuitOptions(){
    const selCircuito = $("#circuito");
    if (!selCircuito) return;
    // Fuerza SIEMPRE las 5 opciones canónicas (evita valores raros)
    const keep = selCircuito.value;
    selCircuito.innerHTML = "";
    const ph = document.createElement("option");
    ph.value=""; ph.hidden=true; ph.selected=true; ph.textContent="Seleccionar circuito…";
    selCircuito.appendChild(ph);
    for (let i=1;i<=5;i++){
      const txt = `Circuito ${String(i).padStart(2,'0')}`;
      const o = document.createElement("option");
      o.value = txt; o.textContent = txt;
      selCircuito.appendChild(o);
    }
    if (keep) selCircuito.value = keep;
  }

  function disableInstitucionPlaceholder(){
    const selInst = $("#institucion");
    if (!selInst) return;
    selInst.disabled = true;
    selInst.innerHTML = '<option hidden selected value="">Elija circuito primero…</option>';
  }

  // ---------- Estado por AÑO ----------
  let CATALOGS = { meses:[], tipoVisita:[], cicloEscolar:[], asesoria:[] };
  let CIRCUITS_MAP = {};

  function renderForYear(year){
    CATALOGS     = loadCatalogsByYear(year);
    CIRCUITS_MAP = loadCircuitsMapByYear(year);

    fillSelect($("#asesoria"),     CATALOGS.asesoria,     "Seleccionar asesoría…");
    fillSelect($("#mes"),          CATALOGS.meses,        "Seleccionar mes…");
    fillSelect($("#tipoVisita"),   CATALOGS.tipoVisita,   "Seleccionar tipo…");
    fillSelect($("#cicloEscolar"), CATALOGS.cicloEscolar, "Seleccionar ciclo…");

    ensureCircuitOptions();
    const selCircuito = $("#circuito");
    const selInst     = $("#institucion");
    if (!selCircuito || !selInst) return;

    const refreshInst = () => {
      const val = selCircuito.value || "";
      const txt = selectedText(selCircuito) || "";
      const cKey = canonCircuitKey(val) || canonCircuitKey(txt);
      const list = cKey && Array.isArray(CIRCUITS_MAP[cKey]) ? CIRCUITS_MAP[cKey] : [];
      fillSelect(selInst, uniqSorted(list), list.length ? "Seleccionar…" : "No hay instituciones");
      selInst.disabled = list.length === 0;
    };

    if (selCircuito.__depHandler) selCircuito.removeEventListener("change", selCircuito.__depHandler);
    selCircuito.__depHandler = () => refreshInst();
    selCircuito.addEventListener("change", selCircuito.__depHandler);

    disableInstitucionPlaceholder();
    refreshInst();

    const pill = $("#yearPill");
    if (pill) pill.textContent = `Año ${year}`;
  }

  // ---------- Submit (guarda por AÑO) ----------
  function bindFormSubmit(){
    const form = $("#frmVisita");
    if (!form) return;

    form.addEventListener("submit", (ev)=>{
      ev.preventDefault();

      const data = {
        year:          AppYearShim.get(),
        asesoria:      $("#asesoria")?.value || "",
        circuito:      $("#circuito")?.value || "",
        institucion:   $("#institucion")?.value || "",
        mes:           $("#mes")?.value || "",
        fecha:         $("#fecha")?.value || "",
        tipoVisita:    $("#tipoVisita")?.value || "",
        cicloEscolar:  $("#cicloEscolar")?.value || "",
        tematica:      $("#tematica")?.value || "",
        observacion:   $("#observacion")?.value || ""
      };

      if (!data.asesoria || !data.circuito || !data.institucion ||
          !data.mes || !data.tipoVisita || !data.cicloEscolar || !data.fecha) {
        alert("Faltan campos obligatorios.");
        return;
      }

      const sink = readJSON(VISITS_SINK, {});
      const y = String(data.year || "sinYear");
      sink[y] = Array.isArray(sink[y]) ? sink[y] : [];
      sink[y].push(data);
      writeJSON(VISITS_SINK, sink);

      try { localStorage.setItem('visitas_jefatura_last_update', String(Date.now())); } catch {}

      alert("Guardado en el año " + y);
      form.reset();
      disableInstitucionPlaceholder();
    });

    const btnLimpiar = $("#btnLimpiar");
    if (btnLimpiar) {
      btnLimpiar.addEventListener("click", ()=>{
        form.reset();
        disableInstitucionPlaceholder();
      });
    }
  }

  // ---------- Reacciones a cambio de año / edición MR ----------
  function bindYearAndStorage(){
    window.addEventListener("yearchange", (ev)=>{
      const y = String(ev?.detail?.year ?? getYear());
      renderForYear(y);
    });
    window.addEventListener("storage", (ev)=>{
      if (!ev.key) return;
      const y = getYear();
      if (ev.key === MR_KEY(y)) renderForYear(y);   // refresca sólo el año activo
    });
  }

  // ---------- Init ----------
  function start(){
    const y = getYear();
    renderForYear(y);
    bindFormSubmit();
    bindYearAndStorage();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();

})();
