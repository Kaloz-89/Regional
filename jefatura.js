(() => {
  "use strict";

  /* =========================================================
     JEFATURA — Admin
     Depende SOLO de marco_referencia_catalogos_v1_<AÑO>
     Meses: SIEMPRE los 12 meses precargados (ignora valores viejos)
  ========================================================= */

  // ---------- Helpers ----------
  const $  = (s, ctx=document) => ctx.querySelector(s);
  const readJSON  = (k, fb=null) => { try { return JSON.parse(localStorage.getItem(k)||'null') ?? fb; } catch { return fb; } };
  const writeJSON = (k, v)      => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const uniqSorted = (arr) => Array.from(new Set((arr||[]).map(v=>String(v).trim()))).filter(Boolean)
                                   .sort((a,b)=>a.localeCompare(b,'es',{numeric:true,sensitivity:'base'}));
  const normText = (s) => String(s||"")
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ')
    .trim();
  const val = (v) => (v==null ? "" : String(v));

  // Meses precargados (únicos permitidos en UI)
  const DEFAULT_MESES = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
  ];

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

  // Año
  const AppYear = window.AppYear || (() => {
    const KEY="app_year_v1", DEF=2025;
    return { getYear: () => parseInt(localStorage.getItem(KEY)||DEF,10)||DEF };
  })();
  const YEAR = String(AppYear.getYear());

  // ---------- Claves ----------
  const STORE_KEY = "visitas_jefatura_v1";
  const MR_PREFIX = "marco_referencia_catalogos_v1";
  const mrKeyForYear = (y) => `${MR_PREFIX}_${y}`;

  // ---------- MR: lectura robusta (meses forzados por defecto) ----------
  function normalizeMR(objRaw){
    // Forzamos meses a DEFAULT_MESES — ignoramos lo que venga en MR para meses
    const out = {
      meses: [...DEFAULT_MESES],
      tipoVisita: [], cicloEscolar: [], asesoria: [],
      circuits: { circuito01:[], circuito02:[], circuito03:[], circuito04:[], circuito05:[] }
    };

    const pick = (k, ...aliases) => {
      const src = [k, ...aliases].map(key => objRaw?.[key]).find(v => Array.isArray(v));
      return uniqSorted(src || []);
    };
    out.tipoVisita   = pick('tipoVisita','Tipo de visita','tipo','Tipo');
    out.cicloEscolar = pick('cicloEscolar','Ciclo escolar','ciclo','Ciclo');
    out.asesoria     = pick('asesoria','Asesoría','Asesoria','asesorias');

    const pushMany = (canon, list) => {
      const cur = out.circuits[canon] || [];
      out.circuits[canon] = uniqSorted([...cur, ...list]);
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

    // Integra canónicas si existen
    for (let i=1;i<=5;i++){
      const k = `circuito${String(i).padStart(2,'0')}`;
      if (Array.isArray(objRaw?.[k])) pushMany(k, objRaw[k]);
    }
    // Migra variantes
    Object.keys(objRaw || {}).forEach(k => {
      if (['meses','Meses','mes','tipoVisita','Tipo de visita','tipo','Tipo','cicloEscolar','Ciclo escolar','ciclo','Ciclo','asesoria','Asesoría','Asesoria','asesorias'].includes(k)) return;
      const canon = canonCircuitKey(k);
      if (canon) pushMany(canon, takeInstitutions(objRaw[k]));
    });

    return out;
  }

  function readMR(year){
    const raw = readJSON(mrKeyForYear(year), null) || {};
    return normalizeMR(raw);
  }

  // ---------- IO Jefatura ----------
  function normalizeRow(src){
    const r = src || {};
    const id = r.id || `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,6)}`;
    return {
      id,
      asesoria:     val(r.asesoria),
      circuito:     canonCircuitKey(r.circuito) || val(r.circuito),
      institucion:  val(r.institucion),
      mes:          val(r.mes),
      fecha:        val(r.fecha),
      tipoVisita:   val(r.tipoVisita),
      cicloEscolar: val(r.cicloEscolar),
      tematica:     val(r.tematica),
      prioridad:    val(r.prioridad),
      observacion:  val(r.observacion),
      validacionJefatura: val(r.validacionJefatura) || "Pendiente",
      estado:             val(r.estado)             || "Sin revisar"
    };
  }

  function readRowsByYear(year){
    const all = readJSON(STORE_KEY, {});
    const arr = (all && Array.isArray(all[year])) ? all[year]
              : (all && all[year] && Array.isArray(all[year].rows)) ? all[year].rows
              : [];
    return (arr||[]).map(normalizeRow);
  }
  function writeRowsByYear(year, rows){
    const all = readJSON(STORE_KEY, {});
    all[year] = Array.isArray(all[year]) ? rows
             : (all[year] && typeof all[year]==='object') ? { ...(all[year]||{}), rows }
             : rows;
    writeJSON(STORE_KEY, all);
    try { localStorage.setItem('visitas_jefatura_last_update', String(Date.now())); } catch {}
    window.dispatchEvent(new CustomEvent("visitas:changed", { detail:{ year } }));
  }

  // ---------- Estado ----------
  let CATALOGS     = { meses:[], tipoVisita:[], cicloEscolar:[], asesoria:[] };
  let CIRCUITS_MAP = {};
  let ROWS         = [];
  const tbody = document.querySelector('.tabla-visitas tbody');

  // ---------- UI ----------
  function tdCell(){ const td=document.createElement('td'); td.className='cell'; return td; }
  function optSel(values, current, placeholder="Seleccionar…"){
    const sel = document.createElement('select');
    const o0  = document.createElement('option');
    o0.value=""; o0.textContent=placeholder; o0.hidden=true;
    sel.appendChild(o0);
    (values||[]).forEach(v=>{ const o=document.createElement('option'); o.value=v; o.textContent=v; sel.appendChild(o); });
    sel.value = (values||[]).includes(current) ? current : "";
    return sel;
  }
  function inputText(v="", type="text"){ const i=document.createElement('input'); i.type=type; i.value=v||""; return i; }
  function textarea(v=""){ const t=document.createElement('textarea'); t.value=v||""; return t; }
  function delButton(){ const b=document.createElement('button'); b.type='button'; b.className='btn--danger'; b.title='Eliminar'; b.setAttribute('aria-label','Eliminar fila'); return b; }

  function buildCircuitSelect(currentCanon){
    const sel = document.createElement('select');
    const o0  = document.createElement('option');
    o0.value=""; o0.textContent="Circuito…"; o0.hidden=true;
    sel.appendChild(o0);
    for (let i=1;i<=5;i++){
      const canon = `circuito${String(i).padStart(2,'0')}`;
      const opt = document.createElement('option');
      opt.value = canon;
      opt.textContent = `Circuito ${String(i).padStart(2,'0')}`;
      sel.appendChild(opt);
    }
    sel.value = currentCanon || "";
    return sel;
  }

  function fillSelectDOM(sel, values, placeholder="Seleccionar…"){
    const prev = sel.value;
    sel.innerHTML = "";
    const o0 = document.createElement("option");
    o0.value=""; o0.textContent=placeholder; o0.hidden=true;
    sel.appendChild(o0);
    (values||[]).forEach(v=>{ const o=document.createElement("option"); o.value=v; o.textContent=v; sel.appendChild(o); });
    sel.value = (values||[]).includes(prev) ? prev : "";
    sel.disabled = (values||[]).length===0;
  }

  // ---------- Render ----------
  function render(){
    if (!tbody) return;
    tbody.innerHTML = "";

    const asesList = CATALOGS.asesoria;
    const mesList  = CATALOGS.meses;           // <- siempre DEFAULT_MESES
    const tvList   = CATALOGS.tipoVisita;
    const ceList   = CATALOGS.cicloEscolar;

    for (const row of ROWS){
      const tr = document.createElement('tr');
      tr.dataset.id = row.id;

      // 1) Asesoría
      { const td = tdCell();
        const sel = optSel(asesList, row.asesoria, "Asesoría…");
        sel.addEventListener('change', ()=> updateRow(row.id, { asesoria: sel.value }));
        td.appendChild(sel); tr.appendChild(td); }

      // 2) Circuito (canon)
      let instSelRef = null;
      { const td = tdCell();
        const currentCanon = canonCircuitKey(row.circuito);
        const sel = buildCircuitSelect(currentCanon);
        sel.addEventListener('change', ()=>{
          const canon = sel.value; // circuito0X
          updateRow(row.id, { circuito: canon, institucion: "" });
          if (instSelRef){
            const list = uniqSorted((CIRCUITS_MAP[canon]||[]));
            fillSelectDOM(instSelRef, list, list.length ? "Institución…" : "No hay instituciones");
          }
        });
        td.appendChild(sel); tr.appendChild(td); }

      // 3) Institución (depende de circuito canónico)
      { const td = tdCell();
        const canon = canonCircuitKey(row.circuito);
        const instList = uniqSorted((canon && Array.isArray(CIRCUITS_MAP[canon])) ? CIRCUITS_MAP[canon] : []);
        const sel = optSel(instList, row.institucion, instList.length ? "Institución…" : "No hay instituciones");
        sel.disabled = instList.length===0;
        sel.addEventListener('change', ()=> updateRow(row.id, { institucion: sel.value }));
        instSelRef = sel;
        td.appendChild(sel); tr.appendChild(td); }

      // 4) Mes (solo DEFAULT_MESES)
      { const td = tdCell();
        const sel = optSel(mesList, row.mes, "Mes…");
        sel.addEventListener('change', ()=> updateRow(row.id, { mes: sel.value }));
        td.appendChild(sel); tr.appendChild(td); }

      // 5) Fecha
      { const td = tdCell();
        const i = inputText(row.fecha, "date");
        i.addEventListener('change', ()=> updateRow(row.id, { fecha: i.value }));
        td.appendChild(i); tr.appendChild(td); }

      // 6) Tipo de visita
      { const td = tdCell();
        const sel = optSel(tvList, row.tipoVisita, "Tipo…");
        sel.addEventListener('change', ()=> updateRow(row.id, { tipoVisita: sel.value }));
        td.appendChild(sel); tr.appendChild(td); }

      // 7) Ciclo escolar
      { const td = tdCell();
        const sel = optSel(ceList, row.cicloEscolar, "Ciclo…");
        sel.addEventListener('change', ()=> updateRow(row.id, { cicloEscolar: sel.value }));
        td.appendChild(sel); tr.appendChild(td); }

      // 8) Temática
      { const td = tdCell();
        const i = inputText(row.tematica, "text");
        i.addEventListener('input', ()=> updateRow(row.id, { tematica: i.value }));
        td.appendChild(i); tr.appendChild(td); }

      // 9) Prioridad
      { const td = tdCell();
        const sel = optSel(["Alta","Media","No aplica"], row.prioridad, "Prioridad…");
        sel.addEventListener('change', ()=> updateRow(row.id, { prioridad: sel.value }));
        td.appendChild(sel); tr.appendChild(td); }

      // 10) Observación
      { const td = tdCell();
        const t = textarea(row.observacion);
        t.addEventListener('input', ()=> updateRow(row.id, { observacion: t.value }));
        td.appendChild(t); tr.appendChild(td); }

      // 11) Validación Jefatura
      { const td = tdCell();
        const sel = optSel(["Pendiente","Validada"], row.validacionJefatura, "Validación…");
        sel.addEventListener('change', ()=> updateRow(row.id, { validacionJefatura: sel.value }));
        td.appendChild(sel); tr.appendChild(td); }

      // 12) Estado
      { const td = tdCell();
        const sel = optSel(["Sin revisar","Revisada"], row.estado, "Estado…");
        sel.addEventListener('change', ()=> updateRow(row.id, { estado: sel.value }));
        td.appendChild(sel); tr.appendChild(td); }

      // 13) Acciones
      { const td = tdCell();
        td.classList.add('col-actions');
        const btnDel = delButton();
        btnDel.addEventListener('click', ()=> deleteRow(row.id));
        td.appendChild(btnDel); tr.appendChild(td); }

      tbody.appendChild(tr);
    }
  }

  // ---------- Mutaciones ----------
  function updateRow(id, patch){
    const all = readJSON(STORE_KEY, {});
    const yearData = Array.isArray(all[YEAR]) ? all[YEAR]
                   : (all[YEAR] && Array.isArray(all[YEAR].rows)) ? all[YEAR].rows
                   : ROWS;
    const idx = yearData.findIndex(r => r.id===id);
    if (idx<0) return;

    if (patch && typeof patch.circuito === 'string') patch.circuito = canonCircuitKey(patch.circuito);
    const updated = { ...yearData[idx], ...patch };
    yearData[idx] = updated;

    writeJSON(STORE_KEY, { ...all, [YEAR]: yearData });
    try { localStorage.setItem('visitas_jefatura_last_update', String(Date.now())); } catch {}
    ROWS = yearData.map(normalizeRow);
    render();
  }
  function deleteRow(id){
    ROWS = ROWS.filter(r => r.id!==id);
    writeRowsByYear(YEAR, ROWS);
    render();
  }
  function addRow(){
    const r = normalizeRow({ prioridad:"No aplica", validacionJefatura:"Pendiente", estado:"Sin revisar" });
    ROWS.unshift(r);
    writeRowsByYear(YEAR, ROWS);
    render();
  }

  // ---------- Carga / Reactividad ----------
  function refreshAll(){
    const mr = readMR(YEAR);
    // Meses SIEMPRE por defecto:
    CATALOGS = {
      meses: [...DEFAULT_MESES],
      tipoVisita: mr.tipoVisita,
      cicloEscolar: mr.cicloEscolar,
      asesoria: mr.asesoria
    };
    CIRCUITS_MAP = { ...mr.circuits }; // {circuito01:[..],...}
    ROWS = readRowsByYear(YEAR);
    render();
  }

  function bindUI(){
    const btnAdd = $('#btnAddRow') || $('#btnAddFila') || document.querySelector('.btn-add');
    if (btnAdd) btnAdd.addEventListener('click', addRow);

    // Cuando MR o Jefatura cambien en otra pestaña
    window.addEventListener('storage', (ev) => {
      if (!ev.key) return;
      if (ev.key === mrKeyForYear(YEAR) || ev.key.startsWith(MR_PREFIX) ||
          ev.key === 'visitas_jefatura_last_update' || ev.key === STORE_KEY) {
        refreshAll();
      }
    });

    // Cambio de año global
    window.addEventListener('yearchange', () => location.reload());
  }

  function start(){ refreshAll(); bindUI(); }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', start); }
  else { start(); }
})();
