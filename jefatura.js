(() => {
  "use strict";

  /* =========================================================
     JEFATURA — Render/Edición y Vínculo con FORMULARIO
     - Lee/escribe localStorage.visitas_jefatura_v1 por AÑO
     - Catálogos y Circuitos/MR: mismos normalizadores que el formulario
     - Actualiza en vivo si otra pestaña (formulario) aporta datos
  ========================================================= */

  // ---------- Helpers ----------
  const $  = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));
  const readJSON  = (k, fb=null) => { try { return JSON.parse(localStorage.getItem(k)||'null') ?? fb; } catch { return fb; } };
  const writeJSON = (k, v)      => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const uniqSorted = (arr) => Array.from(new Set((arr||[]).map(v=>String(v).trim())))
                                   .filter(Boolean)
                                   .sort((a,b)=>a.localeCompare(b,'es',{numeric:true}));

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

  // ---------- Claves y utilidades por año ----------
  const STORE_KEY      = "visitas_jefatura_v1";  // MISMA clave que formulario.js
  const CATALOG_BASES  = ["marco_ref_catalogos_v1","mr_catalogos_v1","marcoRef_catalogos_v1","marco_referencia_catalogos_v1"];
  const CIRCUIT_BASES  = ["marco_ref_circuitos_v1","mr_circuitos_v1","circuitos_v1"];

  const withYearCandidates = (bases, year) => {
    const out = [];
    for (const k of bases) out.push(k, `${k}_${year}`, `${year}_${k}`);
    return out;
  };
  const takeYearSlice = (val, year) => {
    if (!val) return null;
    if (Array.isArray(val)) return val;
    if (typeof val === "object"){
      const y = String(year);
      if (val[y]) return val[y];
      if (val.data && val.data[y]) return val.data[y];
      return val;
    }
    return null;
  };
  const readCandidates = (keys) => {
    for (const k of keys){
      const v = readJSON(k, null);
      if (v != null) return v;
    }
    return null;
  };

  // ---------- Catálogos (Mes, Tipo, Ciclo, Asesoría) ----------
  function loadCatalogsByYear(year){
    const cand = withYearCandidates(CATALOG_BASES, year);
    let raw = readCandidates(cand);
    raw = takeYearSlice(raw, year);

    let meses=[], tipoVisita=[], cicloEscolar=[], asesoria=[];
    if (raw && typeof raw==='object' && !Array.isArray(raw)){
      meses        = uniqSorted(raw.meses || raw.Meses || raw.mes || []);
      tipoVisita   = uniqSorted(raw.tipoVisita || raw['Tipo de visita'] || raw.tipo || []);
      cicloEscolar = uniqSorted(raw.cicloEscolar || raw['Ciclo escolar'] || raw.ciclo || []);
      asesoria     = uniqSorted(raw.asesoria || raw['Asesoría'] || raw['Asesoria'] || raw.asesorias || []);
    } else if (Array.isArray(raw)){
      for (const r of raw){
        if (!r || typeof r!=='object') continue;
        const m  = r.mes ?? r.Mes ?? r['Mes'];
        const tv = r.tipoVisita ?? r['Tipo de visita'] ?? r.tipo ?? r['Tipo'];
        const ce = r.cicloEscolar ?? r['Ciclo escolar'] ?? r.ciclo ?? r['Ciclo'];
        const as = r.asesoria ?? r.Asesoría ?? r['Asesoría'] ?? r.Asesoria ?? r['Asesoria'];
        if (m)  meses.push(String(m));
        if (tv) tipoVisita.push(String(tv));
        if (ce) cicloEscolar.push(String(ce));
        if (as) asesoria.push(String(as));
      }
      meses=uniqSorted(meses); tipoVisita=uniqSorted(tipoVisita);
      cicloEscolar=uniqSorted(cicloEscolar); asesoria=uniqSorted(asesoria);
    }
    return { meses, tipoVisita, cicloEscolar, asesoria };
  }

  // ---------- Circuitos → Instituciones ----------
  function parseCircuits(raw){
    const out = {};
    const pushTo = (ckey, val) => {
      const key = canonCircuitKey(ckey);
      if (!key) return;
      out[key] = out[key] || [];
      if (Array.isArray(val)){
        for (const v of val){
          if (v && typeof v!=='object') out[key].push(String(v));
          else if (v && typeof v==='object' && v.nombre) out[key].push(String(v.nombre));
        }
      } else if (val && typeof val==='object'){
        const arrays = [];
        for (const cand of ['instituciones','centros','escuelas','colegios','lista','items']) {
          if (Array.isArray(val[cand])) arrays.push(...val[cand]);
        }
        arrays.forEach(v=> out[key].push(String(v)));
      } else if (val){
        out[key].push(String(val));
      }
    };

    if (!raw) return out;
    if (Array.isArray(raw)){
      for (const row of raw){
        if (!row || typeof row!=='object') continue;
        const c = row.circuito ?? row.Circuito ?? row['Circuito'] ?? row['circuit'];
        const i = row.institucion ?? row.Institucion ?? row['Institución'] ?? row['institucion'] ?? row['centro'] ?? row['Centro'];
        if (c && i) pushTo(c, [String(i)]);
      }
      return out;
    }
    if (typeof raw==='object'){
      const root = (raw.map && typeof raw.map==='object') ? raw.map : raw;
      for (const k of Object.keys(root)) pushTo(k, root[k]);
    }
    return out;
  }
  function loadCircuitsMapByYear(year){
    const cand = withYearCandidates(CIRCUIT_BASES, year);
    let raw = readCandidates(cand);
    raw = takeYearSlice(raw, year);

    let map = parseCircuits(raw);
    // Asegura 5 claves
    for (let i=1;i<=5;i++){
      const k = `circuito${String(i).padStart(2,'0')}`;
      map[k] = uniqSorted(map[k] || []);
    }
    return map;
  }

  // ---------- Estado global ----------
  let CATALOGS     = { meses:[], tipoVisita:[], cicloEscolar:[], asesoria:[] };
  let CIRCUITS_MAP = {};
  let ROWS         = [];             // arreglo de registros del año
  const tbody = $('.tabla-visitas tbody') || $('.tabla-visitas').querySelector('tbody');

  // ---------- IO por año ----------
  function readRowsByYear(year){
    const all = readJSON(STORE_KEY, {});
    const arr = (all && Array.isArray(all[year])) ? all[year] :
                (all && all[year] && Array.isArray(all[year].rows)) ? all[year].rows : [];
    // clona + asegura esquema
    return (arr||[]).map(r => normalizeRow(r));
  }
  function writeRowsByYear(year, rows){
    const all = readJSON(STORE_KEY, {});
    all[year] = Array.isArray(all[year]) ? rows
               : (all[year] && typeof all[year]==='object') ? { ...(all[year]||{}), rows }
               : rows;
    writeJSON(STORE_KEY, all);
    // Marca actualización para otras pestañas
    try { localStorage.setItem('visitas_jefatura_last_update', String(Date.now())); } catch {}
    // Evento local por si quieres escuchar en esta misma pestaña
    window.dispatchEvent(new CustomEvent("visitas:changed", { detail:{ year } }));
  }

  // ---------- Esquema de fila ----------
  function normalizeRow(src){
    const r = src || {};
    const id = r.id || `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,6)}`;
    return {
      id,
      asesoria:     val(r.asesoria),
      circuito:     val(r.circuito),
      institucion:  val(r.institucion),
      mes:          val(r.mes),
      fecha:        val(r.fecha),
      tipoVisita:   val(r.tipoVisita),
      cicloEscolar: val(r.cicloEscolar),
      tematica:     val(r.tematica),
      prioridad:    val(r.prioridad),                       // "Alta/Media/No aplica"
      observacion:  val(r.observacion),
      validacionJefatura: val(r.validacionJefatura) || "Pendiente",
      estado:             val(r.estado)             || "Sin revisar"
    };
  }
  const val = (v) => (v==null ? "" : String(v));

  // ---------- UI builders ----------
  function tdCell(){
    const td = document.createElement('td');
    td.className = 'cell';
    return td;
  }
  function optSel(values, current, placeholder="Seleccionar…"){
    const sel = document.createElement('select');
    const o0 = document.createElement('option');
    o0.value=""; o0.textContent=placeholder; o0.hidden=true;
    sel.appendChild(o0);
    (values||[]).forEach(v=>{
      const o = document.createElement('option');
      o.value = v; o.textContent = v;
      sel.appendChild(o);
    });
    sel.value = (values||[]).includes(current) ? current : "";
    return sel;
  }
  function inputText(v="", type="text"){
    const i = document.createElement('input');
    i.type = type; i.value = v || "";
    return i;
  }
  function textarea(v=""){
    const t = document.createElement('textarea');
    t.value = v || "";
    return t;
  }
  function delButton(){
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn--danger';
    b.title = 'Eliminar';
    b.setAttribute('aria-label','Eliminar fila');
    return b;
  }

  // ---------- Render de la tabla ----------
  function render(){
    if (!tbody) return;
    tbody.innerHTML = "";

    // Listas base para selects
    const asesList = CATALOGS.asesoria;
    const mesList  = CATALOGS.meses;
    const tvList   = CATALOGS.tipoVisita;
    const ceList   = CATALOGS.cicloEscolar;

    const circuitOpts = Array.from({length:5},(_,i)=>`Circuito ${String(i+1).padStart(2,'0')}`);

    for (const row of ROWS){
      const tr = document.createElement('tr');
      tr.dataset.id = row.id;

      // 1) Asesoría
      {
        const td = tdCell();
        const sel = optSel(asesList, row.asesoria, "Asesoría…");
        sel.addEventListener('change', ()=> updateRow(row.id, { asesoria: sel.value }));
        td.appendChild(sel); tr.appendChild(td);
      }

      // 2) Circuito (mapea a instituciones)
      let lastInstSel = null;
      {
        const td = tdCell();
        const sel = optSel(circuitOpts, displayCircuit(row.circuito), "Circuito…");
        sel.addEventListener('change', ()=>{
          const disp = sel.value; // "Circuito 03"
          const canon = canonCircuitKey(disp);
          updateRow(row.id, { circuito: disp });

          // refresca instituciones
          const list = canon && Array.isArray(CIRCUITS_MAP[canon]) ? CIRCUITS_MAP[canon] : [];
          if (lastInstSel) {
            fillSelectDOM(lastInstSel, list, "Institución…");
            // si la actual no existe, queda vacío
            if (!list.includes(row.institucion)) {
              updateRow(row.id, { institucion: "" });
            }
          }
        });
        td.appendChild(sel); tr.appendChild(td);
      }

      // 3) Institución (depende de circuito)
      {
        const td = tdCell();
        const canon = canonCircuitKey(row.circuito) || canonCircuitKey(displayCircuit(row.circuito));
        const instList = canon && Array.isArray(CIRCUITS_MAP[canon]) ? CIRCUITS_MAP[canon] : [];
        const sel = optSel(instList, row.institucion, instList.length ? "Institución…" : "No hay instituciones");
        sel.disabled = instList.length===0;
        sel.addEventListener('change', ()=> updateRow(row.id, { institucion: sel.value }));
        lastInstSel = sel;
        td.appendChild(sel); tr.appendChild(td);
      }

      // 4) Mes
      {
        const td = tdCell();
        const sel = optSel(mesList, row.mes, "Mes…");
        sel.addEventListener('change', ()=> updateRow(row.id, { mes: sel.value }));
        td.appendChild(sel); tr.appendChild(td);
      }

      // 5) Fecha
      {
        const td = tdCell();
        const i = inputText(row.fecha, "date");
        i.addEventListener('change', ()=> updateRow(row.id, { fecha: i.value }));
        td.appendChild(i); tr.appendChild(td);
      }

      // 6) Tipo de visita
      {
        const td = tdCell();
        const sel = optSel(tvList, row.tipoVisita, "Tipo…");
        sel.addEventListener('change', ()=> updateRow(row.id, { tipoVisita: sel.value }));
        td.appendChild(sel); tr.appendChild(td);
      }

      // 7) Ciclo escolar
      {
        const td = tdCell();
        const sel = optSel(ceList, row.cicloEscolar, "Ciclo…");
        sel.addEventListener('change', ()=> updateRow(row.id, { cicloEscolar: sel.value }));
        td.appendChild(sel); tr.appendChild(td);
      }

      // 8) Temática
      {
        const td = tdCell();
        const i = inputText(row.tematica, "text");
        i.addEventListener('input', ()=> updateRow(row.id, { tematica: i.value }));
        td.appendChild(i); tr.appendChild(td);
      }

      // 9) Prioridad
      {
        const td = tdCell();
        const sel = optSel(["Alta","Media","No aplica"], row.prioridad, "Prioridad…");
        sel.addEventListener('change', ()=> updateRow(row.id, { prioridad: sel.value }));
        td.appendChild(sel); tr.appendChild(td);
      }

      // 10) Observación
      {
        const td = tdCell();
        const t = textarea(row.observacion);
        t.addEventListener('input', ()=> updateRow(row.id, { observacion: t.value }));
        td.appendChild(t); tr.appendChild(td);
      }

      // 11) Validación Jefatura (no viene del formulario; default “Pendiente”)
      {
        const td = tdCell();
        const sel = optSel(["Pendiente","Validada"], row.validacionJefatura, "Validación…");
        sel.addEventListener('change', ()=> updateRow(row.id, { validacionJefatura: sel.value }));
        td.appendChild(sel); tr.appendChild(td);
      }

      // 12) Estado (no viene del formulario; default “Sin revisar”)
      {
        const td = tdCell();
        const sel = optSel(["Sin revisar","Revisada"], row.estado, "Estado…");
        sel.addEventListener('change', ()=> updateRow(row.id, { estado: sel.value }));
        td.appendChild(sel); tr.appendChild(td);
      }

      // 13) Acciones (eliminar)
      {
        const td = tdCell();
        td.classList.add('col-actions');
        const btnDel = delButton();
        btnDel.addEventListener('click', ()=> deleteRow(row.id));
        td.appendChild(btnDel); tr.appendChild(td);
      }

      tbody.appendChild(tr);
    }
  }

  function fillSelectDOM(sel, values, placeholder="Seleccionar…"){
    const prev = sel.value;
    sel.innerHTML = "";
    const o0 = document.createElement("option");
    o0.value=""; o0.textContent=placeholder; o0.hidden=true;
    sel.appendChild(o0);
    (values||[]).forEach(v=>{
      const o = document.createElement("option");
      o.value=v; o.textContent=v; sel.appendChild(o);
    });
    sel.value = (values||[]).includes(prev) ? prev : "";
    sel.disabled = (values||[]).length===0;
  }

  const displayCircuit = (raw) => {
    // Si ya viene “Circuito 03”, respétalo; si viene raro, normaliza a “Circuito 03”
    const key = canonCircuitKey(raw);
    if (!key) return "";
    const n = key.replace('circuito','');
    return `Circuito ${n}`;
  };

  // ---------- Mutaciones ----------
  function updateRow(id, patch){
    const idx = ROWS.findIndex(r => r.id===id);
    if (idx<0) return;
    ROWS[idx] = { ...ROWS[idx], ...patch };
    writeRowsByYear(YEAR, ROWS);
  }
  function deleteRow(id){
    ROWS = ROWS.filter(r => r.id!==id);
    writeRowsByYear(YEAR, ROWS);
    render();
  }
  function addRow(){
    const r = normalizeRow({
      prioridad: "No aplica",
      validacionJefatura: "Pendiente",
      estado: "Sin revisar"
    });
    ROWS.unshift(r);
    writeRowsByYear(YEAR, ROWS);
    render();
  }

  // ---------- Carga inicial y reactividad ----------
  function refreshAll(){
    CATALOGS     = loadCatalogsByYear(YEAR);
    CIRCUITS_MAP = loadCircuitsMapByYear(YEAR);
    ROWS         = readRowsByYear(YEAR);
    render();
  }

  function bindUI(){
    const btnAdd = $('#btnAddFila') || $('.btn-add');
    if (btnAdd) btnAdd.addEventListener('click', addRow);

    // Cuando el formulario en otra pestaña aporte datos:
    window.addEventListener('storage', (ev) => {
      if (ev.key === 'visitas_jefatura_last_update' || ev.key === STORE_KEY) {
        refreshAll();
      }
    });
    // Evento custom (por si en el mismo documento disparas uno)
    window.addEventListener('visitas:changed', (ev) => {
      const y = (ev && ev.detail && ev.detail.year) ? String(ev.detail.year) : YEAR;
      if (y === YEAR) refreshAll();
    });

    // Cambio de año
    window.addEventListener('yearchange', (ev)=>{
      const newY = (ev && ev.detail && ev.detail.year) ? String(ev.detail.year) : YEAR;
      if (newY !== YEAR){
        // NOTA: si usas navegación por query, la página probablemente recarga.
        // Si no, podrías llamar refreshAll() con el nuevo año.
        // Para simplificar, forzamos un refresh:
        location.reload();
      } else {
        refreshAll();
      }
    });
  }

  function start(){
    refreshAll();
    bindUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
